import 'bootstrap/dist/css/bootstrap.min.css';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import State from './state';
import Renderer from './renderer';
import { allowedFileTypes, getFileType } from './allowed-file-types';
import { serverName } from './config';
import prepareDate from './prepare-date';
import contentTypes from './content-types';

class App {
  constructor(state) {
    this.state = state;
    this.id = this.getMyId();
    this.watchFileInfo(Renderer.getElement('#file-info'));
    this.init();
  }

  watchFileInfo(fileInfoEl) {
    this.fileInfo = fileInfoEl;
    fileInfoEl.addEventListener('click', () => {
      this.clearFile();
    });
  }

  init() {
    Promise.resolve(Renderer.getElement('.content')).then((contentEl) => {
      this.contentEl = contentEl;

      return axios.get(`${serverName}/posts/latest`);
    }).then((res) => {
      if (res.status === 200) {
        this.state.addMessages(res.data);

        res.data.forEach((message) => {
          let innerHtmlEl = Renderer.createInnerHtml(message, this.id);
          const messageEl = Renderer.createEl('div', message.id, 'message-item', innerHtmlEl);
          Renderer.prepend(this.contentEl, messageEl);
        });
      }
      this.addListeners();
      this.observeIntersection();
    });
  }

  observeIntersection() {
    let isFirstCall = true;

    let options = {
      root: this.contentEl,
      rootMargin: '0px',
      threshold: 1.0,
    };
    this.emptyAncor = document.querySelector('.empty-anchor');

    const callback = (entries) => {
      if (isFirstCall) {
        isFirstCall = false;
        return;
      }

      if (entries[0].isIntersecting) {
        const items = this.contentEl.querySelectorAll('.message-item');
        const last = items[items.length - 1];
        axios.get(`${serverName}/posts/${last.dataset.id}`).then((res) => {
          if (res.status === 200) {
            this.state.addMessages(res.data, true);
            res.data.reverse().forEach((message) => {
              let innerHtmlEl = Renderer.createInnerHtml(message, this.id);
              const messageEl = Renderer.createEl('div', message.id, 'message-item', innerHtmlEl);
              Renderer.insertBefore(this.contentEl, this.emptyAncor, messageEl);
            });
          }
        }).catch(() => {
          this.emptyAncor.style.display = 'none';
        });
      }
    };

    let observer = new IntersectionObserver(callback, options);

    observer.observe(this.emptyAncor);
  }

  getMyId() {
    // we can use fingerprintjs2 but we'll use just uuid
    let id = localStorage.getItem('id');
    if (!id) {
      id = uuidv4();
      localStorage.setItem('id', id);
    }

    return id;
  }

  addListeners() {
    this.watchSocket();
    this.addUploadListener();
    this.addInputListener();
    this.watchDrop();
    this.addGeoListener();
    this.watchHistoryCall();
  }

  watchHistoryCall() {
    const historyBtn = Renderer.getElement('#history');
    historyBtn.addEventListener('click', () => {
      axios.get(`${serverName}/posts/all`).then((res) => {
        if (res.status === 200) {
          let text = '';
          res.data.forEach((message) => {
            text += `${prepareDate(message.timestamp)}\n`;
            text += `author: ${message.author === this.id ? 'Me' : message.author}\n`;
            text += `${message.message}\n`;
            if (message.type !== contentTypes.TEXT) {
              text += `file: type: ${message.type}, name: ${message.name}, \n`;
              text += `link: ${serverName}/files/${message.name}`;
            }
            text += '\n';
          });
          let link = document.createElement('a');
          link.download = 'history.txt';

          let blob = new Blob([text], { type: 'text/plain' });

          link.href = URL.createObjectURL(blob);

          link.click();

          URL.revokeObjectURL(link.href);
        }
      });
    });
  }

  addGeoListener() {
    const geoSpan = Renderer.getElement('#geo');
    const geo = geoSpan.closest('.input-group-append');
    geo.addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((res) => {
          const { coords } = res;
          this.inputEl.value = `https://maps.google.com/?q=loc:${coords.latitude},${coords.longitude}`;
          this.inputEl.focus();
        });
      }
    });
  }

  watchSocket() {
    this.socket = new WebSocket('wss://ahj-http-yanach.herokuapp.com/');
    this.socket.onmessage = (event) => {
      const { newMessage } = JSON.parse(event.data);

      if (newMessage) {
        let innerHtmlEl = Renderer.createInnerHtml(newMessage, this.id);
        const messageEl = Renderer.createEl('div', newMessage.id, 'message-item', innerHtmlEl);
        Renderer.prepend(this.contentEl, messageEl);
        this.state.addMessage(newMessage);
      }
    };
  }

  addUploadListener() {
    const uploader = document.querySelector('#upload');
    const fileInput = document.querySelector('#fileInput');

    uploader.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (event) => {
      event.preventDefault();
      this.uploadFile(event.target.files[0]);
    });
  }

  addInputListener() {
    this.inputEl = document.querySelector('#messageInput');
    this.inputEl.addEventListener('keyup', (evt) => {
      if (evt.key === 'Enter' && evt.target.value) {
        const formData = new FormData();
        formData.append('type', getFileType(this.file?.type));
        formData.append('message', evt.target.value);
        formData.append('author', this.id);
        formData.append('id', uuidv4());
        if (this.file) {
          formData.append('name', this.file.name);
          formData.append('file', this.file);
        }
        axios.post(`${serverName}/message`, formData).then((res) => {
          if (res.status === 200 && res.data) {
            const newMessage = res.data;
            let innerHtmlEl = Renderer.createInnerHtml(newMessage, this.id);
            const messageEl = Renderer.createEl('div', newMessage.id, 'message-item', innerHtmlEl);
            Renderer.prepend(this.contentEl, messageEl);
            this.state.addMessage(newMessage);
          }
        });
        evt.target.value = '';
        this.clearFile();
      }
    });
  }

  clearFile() {
    this.fileInfo.textContent = '';
    this.fileInfo.style.display = 'none';
    this.file = null;
  }

  watchDrop() {
    const cardBody = Renderer.getElement('.card-body');

    cardBody.addEventListener('dragover', (event) => {
      event.preventDefault();
    });

    cardBody.addEventListener('drop', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.uploadFile(event.dataTransfer.files[0]);
      return false;
    });
  }

  uploadFile(file) {
    if (allowedFileTypes.includes(file.type)) {
      this.file = file;
      this.fileInfo.textContent = file.name;
      this.fileInfo.style.display = 'block';
    }
  }
}

const state = new State();
// eslint-disable-next-line  no-new
new App(state);
