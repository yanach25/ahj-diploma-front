export default function urlify(text) {
  let urlRegex = /(((https?:\/\/)|(www\.))[^\s]+)/g;
  return text.replace(urlRegex, (url, b, c) => {
    let url2 = (c === 'www.') ? `http://${url}` : url;
    return `<a href="${url2}" target="_blank">${url}</a>`;
  });
}
