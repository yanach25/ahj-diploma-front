import contentTypes from './content-types';
import prepareDate from './prepare-date';
import urlify from './urlifly';
import { serverName } from './config';

export default class Renderer {
  static emptyCol = '<div class="col empty"></div>';

  static createEl(tag, id = null, className = null, innerHtml = null) {
    const el = document.createElement(tag);
    el.classList.add('row');
    if (id) {
      el.dataset.id = id;
    }
    if (className) {
      el.classList.add(className);
    }
    if (innerHtml) {
      el.innerHTML = innerHtml;
    }

    return el;
  }

  static createMessageItem(message, myId, innerBlock = null) {
    return `
              ${message.author === myId ? this.emptyCol : ''}
              <div class="col-auto message-wrapper">
                <div class="row timestamp">
                    <div class="col d-flex ${message.author === myId ? 'justify-content-end' : 'justify-content-start'} timestamp">${prepareDate(message.timestamp)}</div>
                </div>
                ${innerBlock || ''}
                <div class="row message">
                  <div class="col d-flex ${message.author === myId ? 'justify-content-end' : 'justify-content-start'}">
                    ${urlify(message.message)}
                  </div>
                </div>
              </div>
              ${message.author === myId ? '' : this.emptyCol}
            `;
  }

  static createInnerHtml(message, myId) {
    let innerBlock = null;
    switch (message.type) {
      case contentTypes.IMG:
        innerBlock = `
                <div class="img d-flex ${message.author === myId ? 'justify-content-end' : 'justify-content-start'}">
                    <a href="${serverName}/files/${message.name}" download target="_blank">
                        <img src="${serverName}/files/${message.name}" alt="${message.name}">
                    </a>
                </div>
        `;
        break;
      case contentTypes.AUDIO:
        innerBlock = `
                <div class="row audio">
                  <figure>
                      <figcaption>
                          <a href="${serverName}/files/${message.name}" download target="_blank">${message.name}</a>
                      </figcaption>
                      <audio
                          controls
                          src="${serverName}/files/${message.name}">
                      </audio>
                  </figure>
                </div>
        `;
        break;
      case contentTypes.VIDEO:
        innerBlock = `
                <div class="row video">
                  <figure>
                      <figcaption>
                          <a href="${serverName}/files/${message.name}" download target="_blank">${message.name}</a>
                      </figcaption>
                      <video width="400" height="300" controls="controls" poster="video/duel.jpg">
                       <source src="${serverName}/files/${message.name}">
                      </video>
                  </figure>
                </div>
        `;
        break;
      default:
        break;
    }

    return this.createMessageItem(message, myId, innerBlock);
  }

  static getElement(selector) {
    return document.querySelector(selector);
  }

  static prepend(parentEl, childEl) {
    parentEl.prepend(childEl);
  }

  static insertBefore(parentEl, target, childEl) {
    parentEl.insertBefore(childEl, target);
  }
}
