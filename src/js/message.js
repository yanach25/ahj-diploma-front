import { v4 as uuidv4 } from 'uuid';
import contentTypes from './content-types';

export default class Message {
  constructor(type = contentTypes.TEXT, message, author, files = null) {
    this.type = type;
    this.message = message;
    this.author = author;
    this.files = files;
    this.id = uuidv4();
    this.timestamp = Date.now();
  }
}
