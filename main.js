"use strict";

let socket;
let recognition;

let p = document.createElement('p');
const words = document.querySelector('.words');
words.appendChild(p);

const language = ['en-US', 'ru-RU', 'es-ES', 'fr-FR', 'it-IT', 'de-DE', 'ja-JP'];


function defineLanguage(langUser) {
  return language.filter((code) => code.slice(0, 2) === langUser).join('');
}

function defineName() {
  let name = prompt("What's your name?");
  if (!name) return defineName();
  else return name.slice(0, 8);
}

function translate(e) {
  const transcript = Array.from(e.results)
    .map((result) => result[0])
    .map((result) => result.transcript)
    .join('');

  if (e.results[0].isFinal) {
    socket.send(transcript);
    p = document.createElement('p');
    p.textContent = transcript;
    words.appendChild(p);

    window.scrollBy(0, 60);
  }
}

function startRecognition(e) {
  recognition.start();
}

function open() {
  // console.log('opened');
  const lang = prompt('Enter the language you know from the set opt. (en, ru, fr, es, it, de, ja)');
  const userLanguage = defineLanguage(lang);
  const navigatorLanguage = defineLanguage(navigator.language.slice(0, 2).toLowerCase());
  recognition.lang = userLanguage ? userLanguage : navigatorLanguage;
  socket.send(`${defineName()}|||${recognition.lang.slice(0, 2)}`);
  recognition.start();

  // console.log(recognition.lang);

  setTimeout(() => wrap.style.top = `-${faq.offsetHeight}px`, 10000);
}

function message(e) {
  if (p.textContent && !e.data.includes('Error')) {
    p = document.createElement('p');
    words.appendChild(p);
    p.textContent = e.data;
  } else {
    p.textContent = e.data;
  }
  window.scrollBy(0, 60);
}

function start(e) {
  if (e.type !== 'click' && e.key !== 'Enter') return;
  e.preventDefault();

  window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!window.WebSocket || !window.SpeechRecognition) {
    enter.textContent = 'Your browser is not supported';
  } else {
    const overlay = document.querySelector('.overlay');
    overlay.style.display = 'none';
    recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.addEventListener('result', translate);
    recognition.addEventListener('end', startRecognition);

    const host = location.origin.replace(/^http/, 'ws');
    socket = new WebSocket(host);
    // console.log(socket);
    socket.addEventListener('open', open);
    socket.addEventListener('message', message);
  }

  window.removeEventListener('keyup', start);
  enter.removeEventListener('click', start);
}

function toggleWrap() {
  if (parseInt(wrap.style.top) < 0) wrap.style.top = 0;
  else wrap.style.top = `-${faq.offsetHeight}px`;
}

const faq = document.querySelector('.faq');
const wrap = document.querySelector('.wrap');
const enter = document.querySelector('.enter');

faq.addEventListener('mouseenter', toggleWrap);
window.addEventListener('keyup', start);
enter.addEventListener('click', start);
