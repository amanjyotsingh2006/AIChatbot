const promptInput = document.querySelector('#prompt');
const chatContainer = document.querySelector('.chat-container');
const imageBtn = document.querySelector('#image');         
const submitBtn = document.querySelector('#submit');
const imageInput = document.querySelector('#image input'); 
const helloGuest = chatContainer?.querySelector('h1');


const API_URL = "YOUR-API-KEY";


const user = {
  data: null,
  file: {
    mime_type: null,
    data: null
  }
};


function createChatBox(html, classes) {
  const div = document.createElement('div');
  div.innerHTML = html;
  div.classList.add(classes);
  return div;
}

function scrollChatToBottom() {
  chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
}

function hideHelloGuest() {
  if (!helloGuest) return;
  helloGuest.style.display = 'none';
}

function formatUserHtml() {
  return `
    <img src="user.png" alt="user" id="userImage" width="50">
    <div class="user-chat-area">
      ${escapeHtml(user.data)}
      ${user.file.data ? `<img src="data:${user.file.mime_type};base64,${user.file.data}" class="chooseimg"/>` : ""}
    </div>
  `;
}


function escapeHtml(unsafe) {
  if (unsafe == null) return '';
  return String(unsafe)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function createAiChatBoxWithLoader() {
  const html = `
    <img src="ai.png" alt="ai" id="aiImage" width="50">
    <div class="ai-chat-area"></div>
    <img src="newload.webp" alt="loading" class="load" width="50">
  `;
  return createChatBox(html, 'ai-chat-box');
}


async function callApi(payload) {
  const opts = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  };

  const resp = await fetch(API_URL, opts);
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`API request failed: ${resp.status} ${resp.statusText} ${text}`);
  }
  return resp.json();
}

async function generateResponse(aiChatBox, fileToSend) {
  const textEl = aiChatBox.querySelector('.ai-chat-area');
  const loader = aiChatBox.querySelector('.load');

  const requestPayload = {
    contents: [{
      parts: [
        { text: user.data },
        ...(fileToSend && fileToSend.data ? [{ inline_data: fileToSend }] : [])
      ]
    }]
  };

  try {
    const data = await callApi(requestPayload);

    if (loader) loader.remove();

    const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidate) {
      textEl.textContent = "No response received from AI.";
      return;
    }

    const airesponse = String(candidate).replace(/\*\*(.*?)\*\*/g, "$1").trim();
    textEl.innerHTML = airesponse;
    scrollChatToBottom();
  } catch (err) {
    if (loader) loader.remove();
    console.error('generateResponse error:', err);
    const textElSafe = aiChatBox.querySelector('.ai-chat-area');
    if (textElSafe) textElSafe.textContent = "Error generating response.";
  }
}


function handleChatResponse(rawMessage) {
  const message = rawMessage?.trim?.() ?? '';
  if (message === '') return;


  const fileToSend = user.file && user.file.data ? { ...user.file } : null;


  user.data = message;

  
  const userHtml = `
    <img src="user.png" alt="user" id="userImage" width="50">
    <div class="user-chat-area">
      ${escapeHtml(user.data)}
      ${fileToSend && fileToSend.data ? `<img src="data:${fileToSend.mime_type};base64,${fileToSend.data}" class="chooseimg"/>` : ""}
    </div>
  `;

  const userChatBox = createChatBox(userHtml, 'user-chat-box');
  chatContainer.appendChild(userChatBox);
  promptInput.value = '';

  
  hideHelloGuest();


  user.file = { mime_type: null, data: null };
  if (imageInput) imageInput.value = ''; 

  setTimeout(() => {
    const aiChatBox = createAiChatBoxWithLoader();
    chatContainer.appendChild(aiChatBox);
    scrollChatToBottom();
    generateResponse(aiChatBox, fileToSend);
  }, 150);
}


function onPromptKeydown(e) {
  if (e.key !== 'Enter') return;

  e.preventDefault();
  e.stopPropagation?.();

  const value = promptInput.value?.trim() ?? '';
  if (value !== '') {
    handleChatResponse(value);
  }
}


function onSubmitClick(e) {
  e.preventDefault();
  const value = promptInput.value?.trim() ?? '';
  if (value !== '') {
    handleChatResponse(value);
  }
}


function onImageInputChange() {
  const file = imageInput?.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const base64string = String(ev.target.result).split(',')[1] ?? '';
    user.file = { mime_type: file.type, data: base64string };
  };
  reader.readAsDataURL(file);
}


function onImageBtnClick() {
  if (imageInput) {
    imageInput.click();
  } else {
    const fallback = document.querySelector('input[type="file"]');
    if (fallback) fallback.click();
    else console.error("No file input found to open.");
  }
}


promptInput?.removeEventListener('keydown', onPromptKeydown);
promptInput?.addEventListener('keydown', onPromptKeydown);

submitBtn?.removeEventListener('click', onSubmitClick);
submitBtn?.addEventListener('click', onSubmitClick);

imageInput?.removeEventListener('change', onImageInputChange);
imageInput?.addEventListener('change', onImageInputChange);

imageBtn?.removeEventListener('click', onImageBtnClick);
imageBtn?.addEventListener('click', onImageBtnClick);

promptInput?.focus();


