const FORM_ID = "send-form";
const MESSAGE_TEXTAREA_ID = "message";
const ERROR_ALERT_ID = "error-alert";
const SEND_MESSAGE_BTN_ID = "send-message-btn";

const JSON_EDITOR_ID = "json-editor";
const JSON_EDITOR_MODAL_ID = "json-editor-modal";
const JSON_EDITOR_TRIGGER_ID = "open-json-edit-modal";
const JSON_EDITOR_ACCEPT_BTN_ID = "jsone-editor-accept";
const JSON_EDITOR_CANCEL_BTN_ID = "jsone-editor-cancel";

const HISTORY_CONTAINER_ID = "history";
const HISTORY_STORAGE_KEY = "mock-ws-history";

const HISTORY_ITEM_COLLAPSE_BTN_CLASS = "history-toggle-collapse";
const HISTORY_ITEM_COPY_BTN_CLASS = "history-copy";
const HISTORY_ITEM_MESSAGE_TEXT_CLASS = "history-message";

const API_SEND_MESSAGE_URL = "/send-sms";

const alertErrorClassList = ["text-red-700", "bg-red-200"];
const alertSuccessClassList = ["text-green-700", "bg-green-200"];

let alertTimeoutId = null;

const storageHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
let history = storageHistory ? JSON.parse(storageHistory) : [];

const updateHistory = (newItem) => {
  history = [{ ...newItem, ts: Date.now() }, ...history];
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
};

const renderHistoryItem = ({ ts, ...data }) => `
    <div class="px-2 mb-2 flex whitespace-nowrap items-center bg-slate-200 rounded-lg">
        <button type="button" class="rotate-90 mr-2 my-2 ${HISTORY_ITEM_COLLAPSE_BTN_CLASS}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1 0 .708l-6 6a.5.5 0 0 1-.708-.708L10.293 8 4.646 2.354a.5.5 0 0 1 0-.708z"></path>
            </svg>
        </button>
        <div class="mr-2 my-2">${new Date(ts).toLocaleString()}</div>
        <div class="overflow-hidden text-ellipsis my-2 break-all font-mono text-xs mr-2 ${HISTORY_ITEM_MESSAGE_TEXT_CLASS}">${JSON.stringify(
  data
, null, 2)}</div>
        <div class="my-2 flex justify-between w-full"><button class="${HISTORY_ITEM_COPY_BTN_CLASS} mr-2 bg-sky-500 text-white rounded-lg px-2 py-2 hover:bg-sky-700 w-full">Copy</button> </div>
    </div>
`;

const renderHistory = () => {
  const container = document.getElementById(HISTORY_CONTAINER_ID);
  const messageTextarea = document.getElementById(MESSAGE_TEXTAREA_ID);

  if (!history.length) {
    container.innerHTML =
      '<div class="text-center p-4 text-2xl font-bold text-gray-400">No history</div>';
  } else {
    container.innerHTML = history
      .map((item) => renderHistoryItem(item))
      .join("");
  }

  /**
   * Collapse item
   */
  document.addEventListener("click", (event) => {
    if (
      event.target &&
      event.target.parentNode.classList.contains(
        HISTORY_ITEM_COLLAPSE_BTN_CLASS
      )
    ) {
      const item = event.target.parentNode.parentNode;
      const message = event.target.parentNode.parentNode.querySelector(`.${HISTORY_ITEM_MESSAGE_TEXT_CLASS}`);
      if (item.classList.contains("whitespace-nowrap")) {
        event.target.parentNode.classList.remove("rotate-90");
        event.target.parentNode.style = "transform: rotate(270deg)!important";
        item.classList.remove("whitespace-nowrap");
        item.classList.add("flex-wrap");

        const pre = document.createElement('pre');
        pre.innerHTML = message.innerHTML;
        pre.classList.add('w-full', 'bg-white', 'font-mono', 'p-2', HISTORY_ITEM_MESSAGE_TEXT_CLASS);
        message.replaceWith(pre);
      } else {
        event.target.parentNode.classList.add("rotate-90");
        event.target.parentNode.style = "";
        item.classList.add("whitespace-nowrap");
        item.classList.remove("flex-wrap");

        const div = document.createElement('div');
        div.innerHTML = message.innerHTML;
        div.classList.add('overflow-hidden', 'text-ellipsis', 'my-2', 'break-all', 'font-mono', 'text-xs', 'mr-2', HISTORY_ITEM_MESSAGE_TEXT_CLASS);
        message.replaceWith(div);
      }
    }
  });

  /**
   * Copy item
   */
  document.addEventListener("click", (event) => {
    if (
      event.target &&
      event.target.classList.contains(HISTORY_ITEM_COPY_BTN_CLASS)
    ) {
      const message = event.target.parentNode.parentNode.querySelector(`.${HISTORY_ITEM_MESSAGE_TEXT_CLASS}`);
      messageTextarea.value = message.innerText;
      messageTextarea.scrollIntoView({ behavior: 'smooth' });
    }
  });
};

const showError = (text) => {
  const alert = document.getElementById(ERROR_ALERT_ID);
  alert.classList.remove("hidden");
  alert.classList.add(...alertErrorClassList);
  alert.innerText = text;
};

const showSuccess = (text) => {
  const alert = document.getElementById(ERROR_ALERT_ID);
  alert.classList.remove("hidden");
  alert.classList.add(...alertSuccessClassList);
  alert.innerText = text;
  alertTimeoutId = setTimeout(hideAlert, 3000);
};

const hideAlert = () => {
  error = null;
  const alert = document.getElementById(ERROR_ALERT_ID);
  alert.classList.add("hidden");
  alert.classList.remove(...[...alertErrorClassList, ...alertSuccessClassList]);
  alert.innerText = "";
  if (alertTimeoutId) {
    clearTimeout(alertTimeoutId);
  }
};

const initJsonEditor = () => {
  const container = document.getElementById(JSON_EDITOR_ID);
  const options = { maxVisibleChilds: Infinity };
  const editor = new JSONEditor(container, options);

  return editor;
};

const initJsonEditorModal = (editor) => {
  const openJsonEditorBtn = document.getElementById(JSON_EDITOR_TRIGGER_ID);
  const jsonEditorModal = document.getElementById(JSON_EDITOR_MODAL_ID);
  const messageElement = document.getElementById(MESSAGE_TEXTAREA_ID);
  const acceptBtn = document.getElementById(JSON_EDITOR_ACCEPT_BTN_ID);
  const cancelBtn = document.getElementById(JSON_EDITOR_CANCEL_BTN_ID);
  const submitBtn = document.getElementById(SEND_MESSAGE_BTN_ID);

  const openModal = () => {
    jsonEditorModal.classList.remove("hidden");
  };

  const closeModal = () => {
    jsonEditorModal.classList.add("hidden");
  };

  openJsonEditorBtn.addEventListener("click", () => {
    try {
      const parsed = JSON.parse(messageElement.value);
      editor.set(parsed);
      editor.expandAll();
      openModal();
    } catch (e) {
      showError("Invalid JSON");
    }
  });

  acceptBtn.addEventListener("click", () => {
    messageElement.value = JSON.stringify(editor.get());
    submitBtn.click();
    closeModal();
  });

  cancelBtn.addEventListener("click", () => {
    closeModal();
  });
};

const initFormHandling = () => {
  const form = document.getElementById(FORM_ID);
  const message = document.getElementById(MESSAGE_TEXTAREA_ID);

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    fetch(API_SEND_MESSAGE_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: message.value,
    })
      .then((resp) => resp.json())
      .then((data) => {
        if (data.error) {
          showError(data.error);
        } else {
          showSuccess("Message was sent successfully");
          updateHistory(JSON.parse(message.value));
          renderHistory();
        }
      })
      .catch((e) => {
        showError(e || "Some Error occurred");
      });
  });

  message.addEventListener("input", () => {
    hideAlert();
  });
};

const initApp = () => {
  initFormHandling();
  const editor = initJsonEditor();
  initJsonEditorModal(editor);
  renderHistory();
};

document.addEventListener("DOMContentLoaded", initApp);
