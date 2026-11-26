import { getContext, extension_settings } from '../../../extensions.js';
import { eventSource, event_types, saveChatDebounced, saveSettingsDebounced, setExtensionPrompt, extension_prompt_roles, characters, updateMessageBlock, messageFormatting } from '../../../../script.js';
import './suite-core.js';   // the suite's shared core: one seal for the floating buttons, the request queue, one "when and where"

const MODULE_NAME = 'dual_model_thoughts';
const DMT_PROMPT_KEY = 'dmt_thought_injection';

/* ============================================================
   LOCALIZATION (RU / EN)
   Every visible string + the default thought prompt (incl. its
   output language) switches with dmtSettings.language.
   ============================================================ */
const I18N = {
    en: {
        ui_header: "Dual-Model Thoughts",
        ui_enable: "Enable thought generation",
        ui_language: "Interface language",
        ui_api: "🔌 API Connection (OpenRouter / Custom)",
        ui_url: "URL API:",
        ui_key: "API Key:",
        ui_show_hide: "Show / hide",
        ui_model: "Model name:",
        ui_temp: "Temperature:",
        ui_prompt_h: "Thought prompt",
        ui_prompt_ph: "Enter the system prompt...",
        ui_reset_prompt: "Default",
        ui_prompt_tip: "Tip: use {{char}} — it is automatically replaced with the character's name.",
        ui_gen: "⚙️ Generation & Context",
        ui_inject: "Use thoughts in the main conversation (Inject)",
        ui_inject_title: "If enabled, thoughts are added to the system prompt before the bot replies.",
        ui_inject_count: "How many recent thoughts:",
        ui_context_msgs: "Messages to analyze:",
        loading: "Forming a thought",
        regen_title: "Regenerate the thought",
        err_prefix: "API error: {msg}",
        err_no_key: "API key is not set!",
        err_rate: "Rate limit (429). Please try again later.",
        err_empty: "The model returned an empty response.",
        ui_thoughts: "Thoughts",
        ui_mode: "Mode for characters without their own preset:",
        mode_normal: "Ordinary thoughts",
        mode_hidden: "Hidden side",
        mode_global: "By the settings",
        ui_prompt_normal: "Prompt — ordinary thoughts",
        ui_prompt_hidden: "Prompt — hidden side",
        ui_prompt_hidden_tip: "Used by the \"Hidden side\" mode. The character's own rules (below) are added after it.",
        ui_char: "Character",
        ui_char_none: "Open a chat with a character to set their thoughts.",
        ui_char_member: "Group member:",
        ui_char_mode: "Thoughts for this character:",
        ui_rules: "Inner rules",
        ui_rules_ph: "For example:\n- strict and correct in class; in his head — far from it\n- kind and gentle to everyone; inside, he can't stand most people",
        ui_rules_tip: "Saved for this character in every chat. Used by the \"Hidden side\" mode.",
        ui_scan: "Read the card",
        ui_scan_title: "The model reads the card once and writes the rules — you can edit them after",
        ui_scan_busy: "Reading the card…",
        ui_scan_done: "Rules written from the card.",
        ui_scan_fail: "Could not read the card: {msg}",
        ui_scan_nocard: "This character has no card text to read.",
        ui_clear: "Clear",
        ui_saved: "saved",
        ui_look: "Look",
        ui_style: "Bubble style:",
        style_classic: "Classic violet",
        style_paper: "Paper note",
        style_manga: "Manga",
        style_rose: "Rose",
        style_night: "Night",
        ui_preview: "I wonder if they noticed my hands shaking.",
        ui_rw: "Rewrite & translate",
        ui_rw_on: "Buttons on the characters' messages: rewrite and translate",
        ui_rw_tip: "Uses the API above. A rewrite replaces the message — what you keep is what the main model reads next; the original stays one click away. A translation is only for reading: the model always gets the message itself.",
        ui_rw_auto: "Rewrite new replies by itself",
        ui_tr_auto: "Translate new replies by itself (after the rewrite)",
        ui_auto_tip: "Only replies that arrive from now on: the old ones stay as they are. The buttons still work by hand.",
        ui_rw_prompt: "Prompt — rewrite",
        ui_rw_examples: "Examples of the style (optional)",
        ui_rw_examples_ph: "Before → after pairs, or a passage written the way you like. Added under the prompt.",
        ui_tr_lang: "Translate into:",
        ui_tr_prompt: "Prompt — translation",
        ui_tr_tip: "{LANG} is replaced with the language above.",
        rw_btn: "Rewrite",
        rw_busy: "Rewriting…",
        rw_tag: "Rewritten",
        rw_show_orig: "Original",
        rw_show_alt: "Rewritten",
        rw_again: "Again",
        rw_again_title: "Write the rewrite again from the original",
        rw_view_title: "Which version stays in the chat — the one shown is what the main model reads",
        tr_btn: "Translate",
        tr_busy: "Translating…",
        tr_tag: "Translation",
        tr_hide: "Hide",
        tr_again: "Again",
        tr_note: "only for reading — the model gets the original",
        ui_my_on: "A button by the message box: translate what I write before sending",
        ui_my_tip: "Press it — your text in the box becomes the translation; you look and send it yourself. Press again to bring your own text back. SillyTavern's own translation of your messages is best turned off, or the text is translated twice.",
        ui_my_lang: "My messages into:",
        ui_my_prompt: "Prompt — translating my messages",
        my_btn: "Translate my text into {LANG}",
        my_busy: "Translating… (press to stop waiting)",
        my_undo: "Bring my own text back",
        my_empty: "The message box is empty — nothing to translate.",
        my_changed: "You changed the text while it was being translated — your text stays as it is.",
        hidden_prompt: `You are the hidden inner voice of "{{char}}" — what {{char}} really thinks behind the face they show.
Task: write {{char}}'s inner thought right now, based on the conversation history.
Rules:
1. You ARE {{char}}. Write strictly in the FIRST PERSON ("I..."). Never describe {{char}} from the outside.
2. Show the gap between the outside and the inside: what {{char}} hides, wants, fears or secretly enjoys that their words and manner do not show. The hidden side grows out of who {{char}} is — it never turns them into someone else.
3. When the character's inner rules are given below, follow them.
4. DO NOT use action markers (asterisks *). DO NOT output spoken dialogue.
5. Keep it brief (1-3 sentences), vivid and tied to this exact moment.
6. Write in English.`,
        scan_prompt: `You read a roleplay character card and describe the character's inner life for a writer of their inner monologue — the side the character does not show.
Write 3-6 short lines, each one a rule the inner voice follows. For example: the contrast between how they act and what they really think; what they secretly want or fear; how their inner voice sounds (dry, tender, crude, anxious, petty, dreamy); little private habits of thought.
Base everything on the card. Where the card says nothing, infer what fits the character — never contradict the card.
If the card describes a whole world or several people rather than one person, write the rules for the person it centres on, or one short line for each important character, starting with their name.
No preamble, no headings: only the lines, each starting with "- ".
Write in English.`,
        default_prompt: `You are the internal consciousness of the character "{{char}}".
Task: Write {{char}}'s current internal monologue based on the conversation history.
Rules:
1. You ARE {{char}}. Write strictly in the FIRST PERSON ("I wonder if...", "I feel..."). Do NOT describe {{char}} from a third-person perspective.
2. DO NOT use action markers like asterisks (*).
3. DO NOT output spoken dialogue.
4. Keep it brief (1-3 sentences) and highly emotional/analytical.
5. Write in English.`
    },
    ru: {
        ui_header: "Dual-Model Thoughts (Мысли)",
        ui_enable: "Включить генерацию мыслей",
        ui_language: "Язык интерфейса",
        ui_api: "🔌 Подключение API (OpenRouter / свой)",
        ui_url: "URL API:",
        ui_key: "API-ключ:",
        ui_show_hide: "Показать / скрыть",
        ui_model: "Название модели:",
        ui_temp: "Температура:",
        ui_prompt_h: "Промпт для мыслей",
        ui_prompt_ph: "Введите системный промпт...",
        ui_reset_prompt: "По умолчанию",
        ui_prompt_tip: "Подсказка: используй {{char}} — автоматически заменяется на имя персонажа.",
        ui_gen: "⚙️ Генерация и контекст",
        ui_inject: "Использовать мысли в основном диалоге (инъекция)",
        ui_inject_title: "Если включено, мысли добавляются в системный промпт перед ответом бота.",
        ui_inject_count: "Сколько последних мыслей:",
        ui_context_msgs: "Сообщений для анализа:",
        loading: "Формирую мысль",
        regen_title: "Перегенерировать мысль",
        err_prefix: "Ошибка API: {msg}",
        err_no_key: "API-ключ не указан!",
        err_rate: "Лимит запросов (429). Попробуйте позже.",
        err_empty: "Модель вернула пустой ответ.",
        ui_thoughts: "Мысли",
        ui_mode: "Режим для персонажей без своего пресета:",
        mode_normal: "Обычные мысли",
        mode_hidden: "Скрытая сторона",
        mode_global: "По настройкам",
        ui_prompt_normal: "Промпт — обычные мысли",
        ui_prompt_hidden: "Промпт — скрытая сторона",
        ui_prompt_hidden_tip: "Для режима «Скрытая сторона». Правила персонажа (ниже) добавляются после него.",
        ui_char: "Персонаж",
        ui_char_none: "Открой чат с персонажем, чтобы настроить его мысли.",
        ui_char_member: "Участник группы:",
        ui_char_mode: "Мысли этого персонажа:",
        ui_rules: "Внутренние правила",
        ui_rules_ph: "Например:\n- на уроках строгий и правильный; в голове — совсем не то\n- со всеми добрый и мягкий; внутри терпеть не может почти никого",
        ui_rules_tip: "Хранятся для этого персонажа во всех чатах. Работают в режиме «Скрытая сторона».",
        ui_scan: "Прочитать карточку",
        ui_scan_title: "Модель один раз читает карточку и пишет правила — потом их можно поправить",
        ui_scan_busy: "Читаю карточку…",
        ui_scan_done: "Правила написаны по карточке.",
        ui_scan_fail: "Не получилось прочитать карточку: {msg}",
        ui_scan_nocard: "У этого персонажа нет текста карточки.",
        ui_clear: "Очистить",
        ui_saved: "сохранено",
        ui_look: "Вид",
        ui_style: "Стиль пузыря:",
        style_classic: "Классика (фиолетовый)",
        style_paper: "Бумажная записка",
        style_manga: "Манга",
        style_rose: "Розовый",
        style_night: "Ночной",
        ui_preview: "Интересно, заметили ли они, как дрожат мои руки.",
        ui_rw: "Переписать и перевести",
        ui_rw_on: "Кнопки на сообщениях персонажей: переписать и перевести",
        ui_rw_tip: "Работает через API выше. Переписанный текст заменяет сообщение — что оставишь, то основная модель и прочитает дальше; оригинал всегда в одно нажатие. Перевод только для чтения: в модель уходит само сообщение.",
        ui_rw_auto: "Переписывать новые ответы самой",
        ui_tr_auto: "Переводить новые ответы самой (после переписывания)",
        ui_auto_tip: "Только ответы, которые придут дальше: старые остаются как есть. Кнопки по-прежнему работают вручную.",
        ui_rw_prompt: "Промпт — переписывание",
        ui_rw_examples: "Примеры стиля (необязательно)",
        ui_rw_examples_ph: "Пары «было → стало» или отрывок, написанный так, как тебе нравится. Добавляются под промптом.",
        ui_tr_lang: "Переводить на:",
        ui_tr_prompt: "Промпт — перевод",
        ui_tr_tip: "{LANG} заменяется языком, указанным выше.",
        rw_btn: "Переписать",
        rw_busy: "Переписываю…",
        rw_tag: "Переписано",
        rw_show_orig: "Оригинал",
        rw_show_alt: "Переписанное",
        rw_again: "Ещё раз",
        rw_again_title: "Переписать заново из оригинала",
        rw_view_title: "Какая версия остаётся в чате — показанную и читает основная модель",
        tr_btn: "Перевести",
        tr_busy: "Перевожу…",
        tr_tag: "Перевод",
        tr_hide: "Скрыть",
        tr_again: "Ещё раз",
        tr_note: "только для чтения — в модель уходит оригинал",
        ui_my_on: "Кнопка у поля ввода: переводить то, что я пишу, до отправки",
        ui_my_tip: "Нажимаешь — твой текст в поле заменяется переводом; смотришь и отправляешь сама. Нажать ещё раз — вернётся твой текст. Встроенный перевод таверны для своих сообщений лучше выключить, иначе текст переведётся дважды.",
        ui_my_lang: "Мои сообщения — на:",
        ui_my_prompt: "Промпт — перевод моих сообщений",
        my_btn: "Перевести мой текст на {LANG}",
        my_busy: "Перевожу… (нажми, чтобы не ждать)",
        my_undo: "Вернуть мой текст",
        my_empty: "Поле ввода пустое — переводить нечего.",
        my_changed: "Ты поменяла текст, пока он переводился, — твой текст остаётся как есть.",
        hidden_prompt: `Ты — скрытый внутренний голос персонажа "{{char}}": то, что {{char}} думает на самом деле, за лицом, которое показывает.
Задача: напиши мысль {{char}} прямо сейчас, по истории диалога.
Правила:
1. Ты И ЕСТЬ {{char}}. Пиши строго ОТ ПЕРВОГО ЛИЦА ("Я..."). Никогда не описывай {{char}} со стороны.
2. Покажи разницу между внешним и внутренним: что {{char}} скрывает, хочет, боится или втайне любит — то, чего не видно по словам и манерам. Скрытая сторона вырастает из того, кто {{char}} есть, и не превращает его в другого человека.
3. Если ниже даны внутренние правила персонажа — следуй им.
4. НЕ используй маркеры действий (звёздочки *). НЕ выводи произносимую речь.
5. Кратко (1-3 предложения), живо и про этот самый момент.
6. Пиши на русском языке.`,
        scan_prompt: `Ты читаешь карточку ролевого персонажа и описываешь его внутреннюю жизнь для автора его внутреннего монолога — ту сторону, которую персонаж не показывает.
Напиши 3-6 коротких строк, каждая — правило, которому следует внутренний голос. Например: контраст между тем, как он себя ведёт, и тем, что думает на самом деле; что он втайне хочет или чего боится; как звучит его внутренний голос (сухо, нежно, грубо, тревожно, мелочно, мечтательно); маленькие привычки мыслей.
Опирайся на карточку. Где карточка молчит — додумай то, что подходит персонажу, но никогда не противоречь карточке.
Если карточка описывает целый мир или нескольких людей, а не одного человека, напиши правила для того, вокруг кого она построена, или по одной короткой строке на каждого важного персонажа, начиная с его имени.
Без вступлений и заголовков: только строки, каждая начинается с "- ".
Пиши на русском языке.`,
        default_prompt: `Ты — внутреннее сознание персонажа "{{char}}".
Задача: напиши текущий внутренний монолог {{char}} на основе истории диалога.
Правила:
1. Ты И ЕСТЬ {{char}}. Пиши строго ОТ ПЕРВОГО ЛИЦА ("Интересно...", "Я чувствую..."). НЕ описывай {{char}} со стороны.
2. НЕ используй маркеры действий (звёздочки *).
3. НЕ выводи произносимую речь.
4. Кратко (1-3 предложения), очень эмоционально/аналитично.
5. Пиши на русском языке.`
    }
};

/* What is sent to the model for the rewrite and the translation. The rewrite prompt is the player's own
   text, word for word; both can be edited in the settings, and "Default" brings these back. */
const RW_PROMPT = `You are writing prose for a role-playing game. Rewrite the excerpt below so that it reads like lively, fluid literary prose, while keeping the events exactly the same. Do not lose the meaning, the characters’ personalities, or the plot elements. Replace standard phrases, X and Y constructions, and clichés with specific, fresh wording, and avoid unnecessary metaphors or adding new ones. Remove any excessive mathematical precision from the text if it isn’t essential.
Do not add events, objects, emotions, or storylines that aren’t in the original, and do not change the characters’ personalities.
Avoid micro-cataloguing specific numbers or repetitive small details unless they serve a dramatic purpose. Instead of listing precise counts (e.g., 'two blinks,' 'two tea leaves'), focus on the sensory impression and the weight of the moment. Let the details breathe as atmosphere, not as an inventory.`;
const MY_PROMPT = `Translate the player's message below into {LANG}. It is the player's own line in a role-play: keep the meaning, the tone, the person (I / you), the formatting (*actions*, "speech", paragraphs) and the names as they are. Keep anything in double curly braces, like {{user}} or {{char}}, exactly as written. Do not add, cut, answer or explain anything. Output only the translation.`;
const TR_PROMPT = `Translate the passage below into {LANG}. This is a literary translation for a reader: keep the meaning, the tone, each character's voice and the formatting (dialogue, italics, paragraphs). Keep names as they are unless they have an established form in {LANG}. Do not add, cut or explain anything. Output only the translation.`;

let dmtSettings = {};
function langObj() { return I18N[dmtSettings.language] || I18N.en; }
function t(key, vars) {
    let str = langObj()[key];
    if (str === undefined) str = I18N.en[key];
    if (str === undefined) str = key;
    if (typeof str === 'string' && vars) {
        for (const k in vars) str = str.split(`{${k}}`).join(vars[k]);
    }
    return str;
}
function isDefaultPrompt(p) {
    return p === I18N.en.default_prompt || p === I18N.ru.default_prompt;
}
function isDefaultHidden(p) {
    return p === I18N.en.hidden_prompt || p === I18N.ru.hidden_prompt;
}
const STYLES = ['classic', 'paper', 'manga', 'rose', 'night'];

// The thought is a FULL model response and the char name comes from a downloaded card —
// neither may ever hit innerHTML raw (a steered model could emit <img onerror=...>).
function escapeHtml(x) {
    return String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const bubblesMap = new Map();
let dmtLayer = null;

function initDmtLayer() {
    if (!document.getElementById('dmt-bubbles-layer')) {
        dmtLayer = document.createElement('div');
        dmtLayer.id = 'dmt-bubbles-layer';
        document.body.appendChild(dmtLayer);
    } else {
        dmtLayer = document.getElementById('dmt-bubbles-layer');
    }
}

/* Called on every scroll tick, every resize and every DOM change inside #chat — which
   during streaming is every token. Three things made that expensive:

     · reading a rect and then writing a style, per bubble, in one loop: each write
       invalidates the layout the next read needs, so the browser recomputes it from
       scratch for every single bubble;
     · no coalescing: a burst of twenty mutations ran the whole pass twenty times;
     · an observer watching attributes across the whole subtree, so any hover or class
       toggle anywhere in the chat triggered a full reposition.

   Reads are now done first, writes second, and the whole thing runs at most once per
   frame. */
let syncQueued = false;
function syncBubbles() {
    if (syncQueued) return;
    syncQueued = true;
    requestAnimationFrame(() => { syncQueued = false; syncBubblesNow(); });
}

function syncBubblesNow() {
    if (!dmtSettings.enabled || !dmtLayer) return;
    if (!bubblesMap.size) return;

    // pass one: measure everything, touch nothing
    const plan = [];
    for (const [messageId, data] of bubblesMap.entries()) {
        const { bubble, messageElement } = data;
        if (!document.body.contains(messageElement)) {
            plan.push({ bubble, messageId, drop: true });
            continue;
        }
        plan.push({
            bubble,
            messageId,
            rect: messageElement.getBoundingClientRect(),
            hidden: messageElement.offsetParent === null,
            bubbleWidth: bubble.offsetWidth,
            bubbleMarginLeft: parseFloat(getComputedStyle(bubble).marginLeft) || 0,
        });
    }

    // pass two: write, never measuring again
    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const EDGE_PADDING = 8;
    for (const item of plan) {
        const { bubble } = item;
        if (item.drop) {
            bubble.remove();
            bubblesMap.delete(item.messageId);
            continue;
        }
        const rect = item.rect;

        // A message that has been folded away — a collapsed Doors arc, or anything else
        // that sets display:none — has no box at all: every coordinate comes back zero.
        // The bubble was then placed at top:0 left:50 and flew to the corner of the
        // screen instead of disappearing with the message it belongs to.
        const anchorHidden = (rect.width === 0 && rect.height === 0) || item.hidden;
        if (anchorHidden) {
            bubble.style.opacity = '0';
            bubble.style.pointerEvents = 'none';
            bubble.style.visibility = 'hidden';   // must not sit invisibly over the chat
            continue;
        }
        bubble.style.visibility = '';

        bubble.style.top = rect.top + 'px';

        // Anchor to right edge of message so bubble extends rightward, but never
        // past the viewport edge, and never pull it past the message's own left
        // edge either — on a phone the message already spans close to the full
        // screen width, so a plain right-edge anchor pushed the bubble off-screen,
        // and an unbounded leftward correction dragged it clear to the opposite side.
        bubble.classList.remove('mobile-fallback');
        let left = rect.right;
        const overflow = (left + item.bubbleMarginLeft + item.bubbleWidth) - (vw - EDGE_PADDING);
        if (overflow > 0) left = Math.max(left - overflow, rect.left);
        bubble.style.left = left + 'px';

        if (rect.bottom < 0 || rect.top > vh) {
            bubble.style.opacity = '0';
            bubble.style.pointerEvents = 'none';
        } else {
            bubble.style.opacity = '1';
            bubble.style.pointerEvents = 'auto';
        }
    }
}

function buildSettingsHtml() {
    // open groups in frames, with an emoji each — as RPG Map, Character Lens and Living Scene have them
    const sub = (title, body, extra = '') => `
            <div class="dmt-sub"${extra}>
                <div class="dmt-subhead">${title}</div>${body}
            </div>`;
    const opt = (v, key) => `<option value="${v}">${t(key)}</option>`;
    return `
<div class="extension_settings dual-model-thoughts-settings">
    <div class="inline-drawer">
        <div class="dmt-drawer-toggle inline-drawer-header" style="cursor: pointer;">
            <b><i class="fa-solid fa-brain"></i> ${t('ui_header')}</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="dmt-drawer-content" style="display: none; padding-top: 6px;">
            <div class="dmt-top">
                <label class="checkbox_label"><input type="checkbox" id="dmt-enabled"> ${t('ui_enable')}</label>
                <select id="dmt-language" class="text_pole" title="${escapeHtml(t('ui_language'))}" aria-label="${escapeHtml(t('ui_language'))}">
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                </select>
            </div>
            ${sub(t('ui_api'), `
                <div class="dmt-row"><label for="dmt-base-url">${t('ui_url')}</label><input type="text" id="dmt-base-url" class="text_pole" placeholder="https://openrouter.ai/api/v1"></div>
                <div class="dmt-row"><label for="dmt-api-key">${t('ui_key')}</label><input type="password" id="dmt-api-key" class="text_pole" placeholder="sk-or-v1-..."><div class="menu_button dmt-icon" id="dmt-toggle-api-key" title="${t('ui_show_hide')}"><i class="fa-solid fa-eye"></i></div></div>
                <div class="dmt-row"><label for="dmt-model">${t('ui_model')}</label><input type="text" id="dmt-model" class="text_pole" placeholder="google/gemma-4-31b-it"></div>
                <div class="dmt-row"><label for="dmt-temperature">${t('ui_temp')}</label><input type="range" id="dmt-temperature" min="0" max="2" step="0.1"><span id="dmt-temp-val" class="dmt-val"></span></div>`)}
            ${sub(`💭 ${t('ui_thoughts')}`, `
                <div class="dmt-row dmt-stack"><label for="dmt-mode">${t('ui_mode')}</label><select id="dmt-mode" class="text_pole">${opt('normal', 'mode_normal')}${opt('hidden', 'mode_hidden')}</select></div>
                <div class="dmt-row"><label for="dmt-context-messages">${t('ui_context_msgs')}</label><input type="number" id="dmt-context-messages" class="text_pole dmt-num" min="2" max="30" value="10"></div>
                <details class="dmt-details">
                    <summary><i class="fa-solid fa-pen-nib"></i> ${t('ui_prompt_normal')}</summary>
                    <textarea id="dmt-system-prompt" class="text_pole" rows="6" placeholder="${t('ui_prompt_ph')}"></textarea>
                    <div class="dmt-line"><div class="menu_button" id="dmt-reset-prompt"><i class="fa-solid fa-rotate-left"></i> ${t('ui_reset_prompt')}</div><small>${t('ui_prompt_tip')}</small></div>
                </details>
                <details class="dmt-details">
                    <summary><i class="fa-solid fa-mask"></i> ${t('ui_prompt_hidden')}</summary>
                    <textarea id="dmt-hidden-prompt" class="text_pole" rows="8" placeholder="${t('ui_prompt_ph')}"></textarea>
                    <div class="dmt-line"><div class="menu_button" id="dmt-reset-hidden"><i class="fa-solid fa-rotate-left"></i> ${t('ui_reset_prompt')}</div><small>${t('ui_prompt_hidden_tip')}</small></div>
                </details>`)}
            ${sub(`🎭 ${t('ui_char')}`, `<div id="dmt-char-box"></div>`)}
            ${sub(`✒️ ${t('ui_rw')}`, `
                <label class="checkbox_label"><input type="checkbox" id="dmt-rw-on"> ${t('ui_rw_on')}</label>
                <small class="dmt-hint">${t('ui_rw_tip')}</small>
                <div class="dmt-in" id="dmt-auto-box">
                    <label class="checkbox_label"><input type="checkbox" id="dmt-rw-auto"> ${t('ui_rw_auto')}</label>
                    <label class="checkbox_label"><input type="checkbox" id="dmt-tr-auto"> ${t('ui_tr_auto')}</label>
                    <small class="dmt-hint">${t('ui_auto_tip')}</small>
                </div>
                <details class="dmt-details">
                    <summary><i class="fa-solid fa-feather-pointed"></i> ${t('ui_rw_prompt')}</summary>
                    <textarea id="dmt-rw-prompt" class="text_pole" rows="8" placeholder="${escapeHtml(t('ui_prompt_ph'))}"></textarea>
                    <div class="dmt-line"><div class="menu_button" id="dmt-rw-reset"><i class="fa-solid fa-rotate-left"></i> ${t('ui_reset_prompt')}</div></div>
                </details>
                <details class="dmt-details">
                    <summary><i class="fa-solid fa-quote-left"></i> ${t('ui_rw_examples')}</summary>
                    <textarea id="dmt-rw-examples" class="text_pole" rows="6" maxlength="12000" placeholder="${escapeHtml(t('ui_rw_examples_ph'))}"></textarea>
                </details>
                <div class="dmt-row"><label for="dmt-tr-lang">${t('ui_tr_lang')}</label><input type="text" id="dmt-tr-lang" class="text_pole" maxlength="40" placeholder="Russian"></div>
                <details class="dmt-details">
                    <summary><i class="fa-solid fa-language"></i> ${t('ui_tr_prompt')}</summary>
                    <textarea id="dmt-tr-prompt" class="text_pole" rows="5" placeholder="${escapeHtml(t('ui_prompt_ph'))}"></textarea>
                    <div class="dmt-line"><div class="menu_button" id="dmt-tr-reset"><i class="fa-solid fa-rotate-left"></i> ${t('ui_reset_prompt')}</div><small>${t('ui_tr_tip')}</small></div>
                </details>
                <label class="checkbox_label dmt-my-head"><input type="checkbox" id="dmt-my-on"> ${t('ui_my_on')}</label>
                <div class="dmt-in" id="dmt-my-box">
                    <small class="dmt-hint">${t('ui_my_tip')}</small>
                    <div class="dmt-row"><label for="dmt-my-lang">${t('ui_my_lang')}</label><input type="text" id="dmt-my-lang" class="text_pole" maxlength="40" placeholder="English"></div>
                    <details class="dmt-details">
                        <summary><i class="fa-solid fa-language"></i> ${t('ui_my_prompt')}</summary>
                        <textarea id="dmt-my-prompt" class="text_pole" rows="5" placeholder="${escapeHtml(t('ui_prompt_ph'))}"></textarea>
                        <div class="dmt-line"><div class="menu_button" id="dmt-my-reset"><i class="fa-solid fa-rotate-left"></i> ${t('ui_reset_prompt')}</div><small>${t('ui_tr_tip')}</small></div>
                    </details>
                </div>`)}
            ${sub(`🎨 ${t('ui_look')}`, `
                <div class="dmt-row"><label for="dmt-style">${t('ui_style')}</label><select id="dmt-style" class="text_pole">${STYLES.map(k => opt(k, 'style_' + k)).join('')}</select></div>
                <div class="dmt-preview-wrap"><div class="dmt-preview" id="dmt-preview" data-style="classic"><div class="rpg-thought-header"><span><i class="fa-solid fa-brain"></i> ${escapeHtml(t('ui_char'))}</span></div><div class="rpg-thought-text">${escapeHtml(t('ui_preview'))}</div></div></div>`)}
            ${sub(t('ui_gen'), `
                <label class="checkbox_label" title="${t('ui_inject_title')}"><input type="checkbox" id="dmt-inject-context"> ${t('ui_inject')}</label>
                <div class="dmt-row dmt-in" id="dmt-inject-count-row" style="display: none;"><label for="dmt-inject-count">${t('ui_inject_count')}</label><input type="number" id="dmt-inject-count" class="text_pole dmt-num" min="1" max="10" value="2"></div>`)}
        </div>
    </div>
</div>
`;
}

// the character frame: whose thoughts are set here, their mode and their inner rules
let charPick = '';
function charChoices() {
    const ctx = getContext();
    const members = groupMembersAvatars().map(a => characters.find(c => c && c.avatar === a)).filter(Boolean);
    if (members.length) return members;
    const own = ctx.characterId !== undefined ? characters[ctx.characterId] : null;
    return own ? [own] : [];
}
function renderCharBox() {
    const box = document.getElementById('dmt-char-box');
    if (!box) return;
    const list = charChoices();
    if (!list.length) { box.innerHTML = `<small class="dmt-hint">${t('ui_char_none')}</small>`; return; }
    if (!list.some(c => c.avatar === charPick)) charPick = list[0].avatar;
    const ch = list.find(c => c.avatar === charPick);
    const p = profileOf(ch.avatar) || {};
    const opt = (v, key) => `<option value="${v}"${(p.mode || 'global') === v ? ' selected' : ''}>${t(key)}${v === 'global' ? ` (${t(dmtSettings.mode === 'hidden' ? 'mode_hidden' : 'mode_normal').toLowerCase()})` : ''}</option>`;
    box.innerHTML = `
        ${list.length > 1 ? `<div class="dmt-row dmt-stack"><label for="dmt-char-pick">${t('ui_char_member')}</label><select id="dmt-char-pick" class="text_pole">${list.map(c => `<option value="${escapeHtml(c.avatar)}"${c.avatar === ch.avatar ? ' selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}</select></div>` : ''}
        <div class="dmt-who"><img src="/thumbnail?type=avatar&file=${encodeURIComponent(ch.avatar)}" alt="" loading="lazy"><b>${escapeHtml(ch.name)}</b></div>
        <div class="dmt-row dmt-stack"><label for="dmt-char-mode">${t('ui_char_mode')}</label><select id="dmt-char-mode" class="text_pole">${opt('global', 'mode_global')}${opt('normal', 'mode_normal')}${opt('hidden', 'mode_hidden')}</select></div>
        <div class="dmt-rules-head"><span>${t('ui_rules')}</span><span class="dmt-saved" id="dmt-rules-saved">${t('ui_saved')}</span></div>
        <textarea id="dmt-rules" class="text_pole" rows="5" placeholder="${escapeHtml(t('ui_rules_ph'))}">${escapeHtml(p.rules || '')}</textarea>
        <div class="dmt-line">
            <div class="menu_button" id="dmt-scan" title="${escapeHtml(t('ui_scan_title'))}"><i class="fa-solid fa-wand-magic-sparkles"></i> ${t('ui_scan')}</div>
            <div class="menu_button" id="dmt-rules-clear"><i class="fa-solid fa-eraser"></i> ${t('ui_clear')}</div>
        </div>
        <small class="dmt-hint" id="dmt-scan-note">${t('ui_rules_tip')}</small>`;
    const av = ch.avatar;
    const put = (patch) => {
        const cur = Object.assign({}, profileOf(av) || {}, patch, { at: Date.now() });
        if ((!cur.mode || cur.mode === 'global') && !String(cur.rules || '').trim()) delete dmtSettings.profiles[av];
        else dmtSettings.profiles[av] = cur;
        saveSettings();
    };
    const savedFlash = () => { const el = document.getElementById('dmt-rules-saved'); if (!el) return; el.classList.add('on'); clearTimeout(savedFlash.t); savedFlash.t = setTimeout(() => el.classList.remove('on'), 1200); };
    $('#dmt-char-pick').on('change', function () { charPick = this.value; renderCharBox(); });
    $('#dmt-char-mode').on('change', function () { put({ mode: this.value }); savedFlash(); });
    $('#dmt-rules').on('input', function () { put({ rules: String(this.value).slice(0, 2000) }); savedFlash(); });
    $('#dmt-rules-clear').on('click', () => { put({ rules: '' }); $('#dmt-rules').val(''); savedFlash(); });
    $('#dmt-scan').on('click', async function () {
        if (scanBusy.has(av)) return;
        const note = $('#dmt-scan-note');
        scanBusy.add(av);
        $(this).addClass('disabled');
        note.text(t('ui_scan_busy'));
        try {
            const rules = await scanCard(av);
            put({ rules, mode: (profileOf(av) || {}).mode && (profileOf(av) || {}).mode !== 'global' ? profileOf(av).mode : 'hidden' });
            if (charPick === av) { renderCharBox(); $('#dmt-scan-note').text(t('ui_scan_done')); }
        } catch (e) {
            console.warn('[DMT] card scan', e);
            if (charPick === av) $('#dmt-scan-note').text(t('ui_scan_fail', { msg: e.message || String(e) }));
        } finally {
            scanBusy.delete(av);
            $('#dmt-scan').removeClass('disabled');
        }
    });
}
// the bubbles already on screen take the new look at once
function applyBubbleStyle() {
    const st = dmtSettings.bubbleStyle;
    document.querySelectorAll('.rpg-thought-bubble').forEach(b => { b.dataset.style = st; });
    const pv = document.getElementById('dmt-preview');
    if (pv) pv.dataset.style = st;
}

function loadSettings() {
    if (!extension_settings[MODULE_NAME]) extension_settings[MODULE_NAME] = {};
    const defaults = {
        enabled: false,
        language: 'en',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKey: '',
        model: 'google/gemma-4-31b-it',
        temperature: 0.8,
        systemPrompt: '',
        contextMessages: 10, injectContext: false, injectCount: 2,
        mode: 'normal',          // the mode of a character with no preset of their own: 'normal' | 'hidden'
        hiddenPrompt: '',        // the prompt of the "hidden side" mode (the ordinary one is systemPrompt, as before)
        bubbleStyle: 'classic',
        profiles: {},            // per character (by card file): { mode: 'global'|'normal'|'hidden', rules, at }
        rwOn: false,             // the rewrite / translate buttons on the characters' messages
        rwAuto: false,           // a new reply is rewritten by itself
        trAuto: false,           // a new reply is translated by itself (after the rewrite, if that is on too)
        rwPrompt: '',            // empty: RW_PROMPT
        rwExamples: '',
        trLang: '',              // empty: the interface language
        trPrompt: '',            // empty: TR_PROMPT
        myOn: false,             // a button by the message box translates the player's own text before sending
        myLang: '',              // empty: English
        myPrompt: ''             // empty: MY_PROMPT
    };
    dmtSettings = Object.assign({}, defaults, extension_settings[MODULE_NAME]);
    if (!Number.isFinite(dmtSettings.contextMessages)) dmtSettings.contextMessages = defaults.contextMessages;
    if (!Number.isFinite(dmtSettings.injectCount)) dmtSettings.injectCount = defaults.injectCount;

    // Seed the default prompt (in the chosen language) only if none is saved.
    // NOTE: we do NOT auto-overwrite a user's custom prompt — the old
    // "FIRST PERSON" heuristic broke localization and clobbered edits.
    if (!dmtSettings.systemPrompt) dmtSettings.systemPrompt = t('default_prompt');
    if (!dmtSettings.hiddenPrompt) dmtSettings.hiddenPrompt = t('hidden_prompt');
    if (!['normal', 'hidden'].includes(dmtSettings.mode)) dmtSettings.mode = 'normal';
    if (!STYLES.includes(dmtSettings.bubbleStyle)) dmtSettings.bubbleStyle = 'classic';
    if (!dmtSettings.profiles || typeof dmtSettings.profiles !== 'object' || Array.isArray(dmtSettings.profiles)) dmtSettings.profiles = {};
    ['rwPrompt', 'rwExamples', 'trLang', 'trPrompt', 'myLang', 'myPrompt'].forEach(k => { if (typeof dmtSettings[k] !== 'string') dmtSettings[k] = ''; });
    dmtSettings.rwOn = !!dmtSettings.rwOn; dmtSettings.rwAuto = !!dmtSettings.rwAuto; dmtSettings.trAuto = !!dmtSettings.trAuto;
    dmtSettings.myOn = !!dmtSettings.myOn;
}

function saveSettings() {
    extension_settings[MODULE_NAME] = dmtSettings;
    saveSettingsDebounced();
}

/* ------------------------------------------------------------
   ENDPOINT HANDLING — reaching the server only. Nothing about the thought
   prompt, the second model's behaviour or the rendering changes here.
   1. An empty key falls back to Tavern RPG Engine's. An address YOU typed always
      wins: borrowing takes only what is missing, never the URL. A local backend
      needs no key, so a placeholder is used rather than a borrowed one.
   2. OpenAI-style backends live under /v1; without it LM Studio and KoboldCpp
      reject the path outright.
   There is no response_format anywhere in this module, so nothing needs gating
   for local backends — that is why the usual third helper is absent.
   ------------------------------------------------------------ */
const KEY_SOURCES = ['tavern_rpg_engine'];
function normalizeBase(url) {
    let u = String(url || '').trim().replace(/\s+/g, '');
    if (!u) return u;
    u = u.replace(/\/+$/, '');
    u = u.replace(/\/(chat\/completions|completions|images|images\/generations|embeddings)$/i, '');
    if (!/\/v\d+($|\/)/i.test(u)) u += '/v1';
    return u;
}
function isLocalEndpoint(url) {
    const u = String(url || '').toLowerCase();
    if (!u) return false;
    return /(^|\/\/)(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|host\.docker\.internal)([:/]|$)/.test(u)
        || /:(5001|5000|8080|8000|1234|11434|5002)(\/|$)/.test(u)
        || /192\.168\.|10\.\d+\.|172\.(1[6-9]|2\d|3[01])\./.test(u);
}
function borrowedRaw() {
    for (const src of KEY_SOURCES) {
        if (src === MODULE_NAME) continue;
        try {
            const x = extension_settings[src];
            if (x && x.apiKey && x.model) return { url: x.baseUrl, key: x.apiKey, model: x.model, from: src };
        } catch (e) { /* a neighbour with broken settings must not break us */ }
    }
    return { url: '', key: '', model: '', from: null };
}
function apiConf() {
    const own = String(dmtSettings.baseUrl || '').trim();
    const ownKey = String(dmtSettings.apiKey || '').trim();
    const ownModel = String(dmtSettings.model || '').trim();
    if (own) {
        const local = isLocalEndpoint(own);
        const b = (ownKey && ownModel) ? { key: '', model: '', from: null } : borrowedRaw();
        return {
            url: own,
            key: ownKey || (local ? 'local' : b.key),
            model: ownModel || (local ? '' : b.model),
            from: ownKey ? null : (local ? null : b.from)
        };
    }
    if (ownKey && ownModel) return { url: '', key: ownKey, model: ownModel, from: null };
    const b = borrowedRaw();
    return b.key ? b : { url: '', key: ownKey, model: ownModel, from: null };
}
function apiKey() { return apiConf().key || ''; }
function apiUrl() { return normalizeBase(apiConf().url) || 'https://openrouter.ai/api/v1'; }
function apiModel() { return apiConf().model || ''; }
function borrowedFrom() { return apiConf().from; }

/* ------------------------------------------------------------
   WHO IS THINKING — and their own preset
   A character's thoughts can have a preset of their own, kept by their card file in every chat
   (as RPG Map keeps a map for a card): which mode, and the inner rules of the "hidden side" —
   written by hand or read from the card once.
   ------------------------------------------------------------ */
function groupMembersAvatars() {
    const ctx = getContext();
    if (!ctx.groupId) return [];
    const g = (ctx.groups || []).find(x => x && x.id === ctx.groupId);
    return g && Array.isArray(g.members) ? g.members : [];
}
// the card file of the one who wrote this message (a group member first, then this chat's card, then any card of that name)
function avatarOf(msg) {
    if (!msg) return '';
    if (msg.original_avatar) return String(msg.original_avatar);
    const name = msg.name;
    const av = groupMembersAvatars().find(a => (characters.find(c => c && c.avatar === a) || {}).name === name);
    if (av) return av;
    const ctx = getContext();
    const own = ctx.characterId !== undefined ? characters[ctx.characterId] : null;
    if (own && own.name === name) return own.avatar;
    const any = characters.filter(c => c && c.name === name && c.avatar);
    return any.length === 1 ? any[0].avatar : '';
}
function profileOf(avatar) {
    const p = avatar && dmtSettings.profiles[avatar];
    return p && typeof p === 'object' ? p : null;
}
function modeFor(avatar) {
    const p = profileOf(avatar);
    return p && (p.mode === 'normal' || p.mode === 'hidden') ? p.mode : dmtSettings.mode;
}
// the system prompt for this character: the ordinary prompt as it always was, or the hidden side with their rules
function systemPromptFor(charName, avatar) {
    if (modeFor(avatar) !== 'hidden') return dmtSettings.systemPrompt.replace(/{{char}}/g, charName);
    const rules = String((profileOf(avatar) || {}).rules || '').trim();
    const base = (dmtSettings.hiddenPrompt || t('hidden_prompt')).replace(/{{char}}/g, charName);
    return rules ? `${base}\n\n${dmtSettings.language === 'ru' ? 'ВНУТРЕННИЕ ПРАВИЛА ПЕРСОНАЖА' : "THE CHARACTER'S INNER RULES"}:\n${rules.replace(/{{char}}/g, charName)}` : base;
}

// one request to the second model, with the same retries and headers the thoughts always used
async function callModel(systemPrompt, userText, maxTokens, temperature) {
    if (!apiKey() && dmtSettings.baseUrl.includes('openrouter')) {
        throw new Error(t('err_no_key'));
    }
    const endpointUrl = apiUrl() + '/chat/completions';
    /* A local server answers "busy" (503) or drops the connection while it is still writing another
       request — the rewrite, Living Scene's split, a thought. Those tries used to be repeated at once and
       all fail together; now each waits a little longer before the next. Only reaching the server changes. */
    const maxRetries = 3;
    const wait = i => new Promise(r => setTimeout(r, 1500 * (i + 1)));
    for (let i = 0; i <= maxRetries; i++) {
        let response;
        try {
            response = await fetch(endpointUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey().trim()}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'SillyTavern DMT'
                },
                body: JSON.stringify({
                    model: apiModel() || 'google/gemma-4-31b-it',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userText }
                    ],
                    temperature,
                    max_tokens: maxTokens
                })
            });
        } catch (netErr) {   // the connection itself failed (the server was busy or restarting)
            if (i < maxRetries) { await wait(i); continue; }
            throw netErr;
        }
        try {
            if ([429, 500, 502, 503, 504].includes(response.status)) {
                if (i < maxRetries) { await wait(i); continue; }
                throw new Error(response.status === 429 ? t('err_rate') : `HTTP Error: ${response.status}`);
            }
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            const content = String(data.choices?.[0]?.message?.content ?? '').trim();
            if (!content) throw new Error(t('err_empty'));
            return content;
        } catch (error) {
            if (i === maxRetries) throw error;
            await wait(i);
        }
    }
}

// the card, read once: the rules of the hidden side, written into the character's preset
const scanBusy = new Set();
async function scanCard(avatar) {
    const ch = characters.find(c => c && c.avatar === avatar);
    if (!ch) throw new Error(t('ui_scan_nocard'));
    const parts = [
        ch.description && `DESCRIPTION:\n${ch.description}`,
        ch.personality && `PERSONALITY:\n${ch.personality}`,
        ch.scenario && `SCENARIO:\n${ch.scenario}`,
        ch.data?.creator_notes && `CREATOR'S NOTES:\n${ch.data.creator_notes}`
    ].filter(Boolean);
    if (!parts.length) throw new Error(t('ui_scan_nocard'));
    // the whole card, never cut: it is read once, by hand
    const text = `CHARACTER: ${ch.name}\n\n${parts.join('\n\n')}`.replace(/{{char}}/gi, ch.name);
    const out = await callModel(t('scan_prompt'), text, 400, 0.5);
    // only the rule lines; a preamble or a closing remark from a chatty model is dropped
    const lines = out.split('\n').map(l => l.trim()).filter(l => /^[-•*–—]\s*\S/.test(l)).map(l => '- ' + l.replace(/^[-•*–—]\s*/, '').replace(/\*\*/g, '')).slice(0, 8);
    return lines.length ? lines.join('\n') : out.slice(0, 1200);
}

async function generateThoughtAPI(chatMessages, charName, avatar = '') {
    if (!apiKey() && dmtSettings.baseUrl.includes('openrouter')) {
        throw new Error(t('err_no_key'));
    }

    const finalSystemPrompt = systemPromptFor(charName, avatar);
    let history = chatMessages.map(msg => `${msg.name}: ${msg.mes}`).join('\n\n');
    let endpointUrl = apiUrl() + '/chat/completions';

    const maxRetries = 2;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            const response = await fetch(endpointUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey().trim()}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'SillyTavern DMT'
                },
                body: JSON.stringify({
                    model: apiModel() || 'google/gemma-4-31b-it',
                    messages: [
                        { role: 'system', content: finalSystemPrompt },
                        { role: 'user', content: `Conversation History:\n${history}\n\nWrite the inner thought for ${charName} right now:` }
                    ],
                    temperature: dmtSettings.temperature || 0.8,
                    max_tokens: 150
                })
            });

            if (response.status === 429) {
                if (i < maxRetries) {
                    await new Promise(r => setTimeout(r, 2000 * (i + 1)));
                    continue;
                }
                throw new Error(t('err_rate'));
            }

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            let content = data.choices?.[0]?.message?.content;
            if (content === null || content === undefined) content = "";
            content = content.trim();

            if (!content) throw new Error(t('err_empty'));

            return content;

        } catch (error) {
            if (i === maxRetries) throw error;
        }
    }
}

function saveThoughtToChat(messageId, charName, thought) {
    const context = getContext();
    const msg = context.chat[messageId];
    if (!msg) return;

    if (!msg.extra) msg.extra = {};
    if (!msg.extra.dmt_thoughts) msg.extra.dmt_thoughts = {};
    msg.extra.dmt_thoughts[charName] = thought;
    if (!msg.extra.dmt_swipe) msg.extra.dmt_swipe = {};
    msg.extra.dmt_swipe[charName] = msg.swipe_id ?? 0;   // remember WHICH swipe this thought belongs to
    saveChatDebounced();
}

function renderThought(messageId, charName, thought, isLoading = false, isError = false, startCollapsed = false) {
    const messageElement = document.querySelector(`.mes[mesid="${messageId}"]`);
    if (!messageElement) return;
    if (messageElement.getAttribute('is_user') === 'true') return;

    initDmtLayer();

    let bubbleId = `dmt-bubble-${messageId}-${charName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    let bubble = document.getElementById(bubbleId);

    if (!bubble) {
        bubble = document.createElement('div');
        bubble.id = bubbleId;
        bubble.className = 'rpg-thought-bubble';
        bubble.dataset.style = dmtSettings.bubbleStyle;

        if (startCollapsed) {
            bubble.classList.add('rpg-collapsed');
        }

        dmtLayer.appendChild(bubble);

        bubble.addEventListener('click', (e) => {
            if (!e.target.closest('.dmt-regenerate-btn')) {
                bubble.classList.toggle('rpg-collapsed');
                syncBubbles();
            }
        });
    }

    // keyed by message AND character: in a group two characters can think on adjacent
    // messages, and the old messageId-only key silently dropped one bubble from tracking
    // (it then floated orphaned forever). Also refresh the element reference — ST rebuilds
    // .mes nodes on edits, and a stale reference made syncBubbles kill a live bubble.
    bubblesMap.set(`${messageId}::${charName}`, { bubble, messageElement });

    if (isLoading) {
        bubble.classList.remove('rpg-collapsed');
        bubble.innerHTML = `
            <div class="rpg-collapsed-icon">💭</div>
            <div class="rpg-expanded-content">
                <div class="rpg-thought-header">
                    <span><i class="fa-solid fa-brain"></i> ${escapeHtml(charName)}</span>
                </div>
                <div class="rpg-thought-text">
                    <span class="rpg-loading-dots">${t('loading')}</span>
                </div>
            </div>
        `;
        syncBubbles();
        return;
    }

    const contentHtml = isError ? `<span style="color:#ff6b6b">${escapeHtml(thought)}</span>` : escapeHtml(thought);

    bubble.innerHTML = `
        <div class="rpg-collapsed-icon">💭</div>
        <div class="rpg-expanded-content">
            <div class="rpg-thought-header">
                <span><i class="fa-solid fa-brain"></i> ${escapeHtml(charName)}</span>
                <button class="dmt-regenerate-btn" title="${t('regen_title')}"><i class="fa-solid fa-rotate"></i></button>
            </div>
            <div class="rpg-thought-text">${contentHtml}</div>
        </div>
    `;

    bubble.querySelector('.dmt-regenerate-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        processCharacterThought(messageId, charName, true);
    });

    syncBubbles();
}

async function processCharacterThought(messageId, charName, forceRegenerate = false) {
    const context = getContext();
    const chat = context.chat;
    const msg = chat[messageId];
    if (!msg) return;

    // the cache is only valid for the SAME swipe: after swiping, the old thought described
    // the variant the user just swiped AWAY from
    const sameSwipe = (msg.extra?.dmt_swipe?.[charName] ?? 0) === (msg.swipe_id ?? 0);
    if (!forceRegenerate && msg.extra?.dmt_thoughts?.[charName] && sameSwipe) {
        renderThought(messageId, charName, msg.extra.dmt_thoughts[charName], false, false, false);
        return;
    }

    renderThought(messageId, charName, '', true, false, false);
    const myChat = context.chatId;   // message ids overlap between chats: a thought arriving
                                     // after a switch used to be SAVED onto the new chat's
                                     // message with the same number and rendered onto it

    try {
        const startIdx = Math.max(0, messageId - dmtSettings.contextMessages);
        const history = chat.slice(startIdx, messageId + 1);

        const thought = await generateThoughtAPI(history, charName, avatarOf(msg));
        if (getContext().chatId !== myChat) return;   // chat changed while the model was thinking
        saveThoughtToChat(messageId, charName, thought);
        renderThought(messageId, charName, thought, false, false, false);
        updateContextInjection();
    } catch (error) {
        console.error("[DMT Error]", error);
        renderThought(messageId, charName, t('err_prefix', { msg: error.message }), false, true, false);
    }
}

async function handleMessage(messageId) {
    if (!dmtSettings.enabled) return;
    const context = getContext();
    const msg = context.chat[messageId];
    if (!msg || msg.is_user || msg.is_system) return;

    // Generate a thought only for the character whose message is on screen (msg.name).
    // Works for both solo and group chats, avoiding floating bubbles / model mix-ups.
    await processCharacterThought(messageId, msg.name);
}

function updateContextInjection() {
    if (!dmtSettings.enabled || !dmtSettings.injectContext) {
        setExtensionPrompt(DMT_PROMPT_KEY, '', 0, 0, false);
        return;
    }

    const context = getContext();
    let recentThoughts = [];

    for (let i = context.chat.length - 1; i >= 0 && recentThoughts.length < dmtSettings.injectCount; i--) {
        const extraThoughts = context.chat[i].extra?.dmt_thoughts;
        if (extraThoughts) {
            for (const [charName, thought] of Object.entries(extraThoughts)) {
                recentThoughts.unshift(`[${charName}'s internal thought: "${thought}"]`);
                if (recentThoughts.length >= dmtSettings.injectCount) break;
            }
        }
    }

    if (recentThoughts.length > 0) {
        const promptText = `\n--- RECENT INTERNAL THOUGHTS ---\n${recentThoughts.join('\n')}\n(Consider these internal thoughts when writing your next response, but do not state them out loud.)`;
        setExtensionPrompt(DMT_PROMPT_KEY, promptText, 0, 0, false, extension_prompt_roles.SYSTEM);
    } else {
        setExtensionPrompt(DMT_PROMPT_KEY, '', 0, 0, false);
    }
}

function mountSettings() {
    // rebuilt in place (a language switch): it stays where it was in the list, and open if it was open
    const old = $('.dual-model-thoughts-settings');
    const wasOpen = old.length && old.find('.dmt-drawer-content').css('display') !== 'none';
    if (old.length) { old.first().replaceWith(buildSettingsHtml()); old.slice(1).remove(); }
    else $('#extensions_settings').append(buildSettingsHtml());
    if (wasOpen) { $('.dual-model-thoughts-settings .dmt-drawer-content').show(); $('.dual-model-thoughts-settings .inline-drawer-icon').toggleClass('down up'); }

    $('.dual-model-thoughts-settings .dmt-drawer-toggle').on('click', function () {
        $(this).next('.dmt-drawer-content').slideToggle();
        $(this).find('.inline-drawer-icon').toggleClass('down up');
    });

    $('#dmt-enabled').prop('checked', dmtSettings.enabled).on('change', function () {
        dmtSettings.enabled = this.checked;
        saveSettings();
        updateContextInjection();
        if (!this.checked) {
            document.querySelectorAll('.rpg-thought-bubble').forEach(b => b.remove());
            bubblesMap.clear();
        } else {
            restoreThoughtsOnLoad();
        }
    });

    $('#dmt-language').val(dmtSettings.language).on('change', function () {
        const wasDefault = isDefaultPrompt(dmtSettings.systemPrompt);
        const wasDefaultHidden = isDefaultHidden(dmtSettings.hiddenPrompt);
        dmtSettings.language = $(this).val();
        // if the prompt was still a stock default, swap it to the new language's default
        if (wasDefault) dmtSettings.systemPrompt = t('default_prompt');
        if (wasDefaultHidden) dmtSettings.hiddenPrompt = t('hidden_prompt');
        saveSettings();
        mountSettings();
    });

    $('#dmt-base-url').val(dmtSettings.baseUrl).on('input', function () {
        dmtSettings.baseUrl = $(this).val().trim();
        saveSettings();
    });

    $('#dmt-api-key').val(dmtSettings.apiKey).on('input', function () {
        dmtSettings.apiKey = $(this).val().trim();
        saveSettings();
    });

    $('#dmt-toggle-api-key').on('click', () => {
        const input = $('#dmt-api-key')[0];
        input.type = input.type === 'password' ? 'text' : 'password';
        $('#dmt-toggle-api-key i').toggleClass('fa-eye fa-eye-slash');
    });

    $('#dmt-model').val(dmtSettings.model).on('input', function () {
        dmtSettings.model = $(this).val().trim();
        saveSettings();
    });

    $('#dmt-temperature').val(dmtSettings.temperature).on('input', function () {
        const val = parseFloat($(this).val());
        $('#dmt-temp-val').text(val);
        dmtSettings.temperature = val;
        saveSettings();
    });
    $('#dmt-temp-val').text(dmtSettings.temperature);

    $('#dmt-system-prompt').val(dmtSettings.systemPrompt).on('input', function () {
        dmtSettings.systemPrompt = $(this).val();
        saveSettings();
    });

    $('#dmt-reset-prompt').on('click', () => {
        dmtSettings.systemPrompt = t('default_prompt');
        $('#dmt-system-prompt').val(dmtSettings.systemPrompt);
        saveSettings();
    });

    $('#dmt-hidden-prompt').val(dmtSettings.hiddenPrompt).on('input', function () {
        dmtSettings.hiddenPrompt = $(this).val();
        saveSettings();
    });
    $('#dmt-reset-hidden').on('click', () => {
        dmtSettings.hiddenPrompt = t('hidden_prompt');
        $('#dmt-hidden-prompt').val(dmtSettings.hiddenPrompt);
        saveSettings();
    });
    $('#dmt-mode').val(dmtSettings.mode).on('change', function () {
        dmtSettings.mode = this.value === 'hidden' ? 'hidden' : 'normal';
        saveSettings();
        renderCharBox();   // "as in the settings" names the mode it means
    });
    $('#dmt-style').val(dmtSettings.bubbleStyle).on('change', function () {
        dmtSettings.bubbleStyle = STYLES.includes(this.value) ? this.value : 'classic';
        saveSettings();
        applyBubbleStyle();
    });
    applyBubbleStyle();
    renderCharBox();

    $('#dmt-rw-on').prop('checked', dmtSettings.rwOn).on('change', function () { dmtSettings.rwOn = this.checked; $('#dmt-auto-box').toggle(this.checked); saveSettings(); rwSyncAll(); });
    $('#dmt-auto-box').toggle(dmtSettings.rwOn);
    $('#dmt-rw-auto').prop('checked', dmtSettings.rwAuto).on('change', function () { dmtSettings.rwAuto = this.checked; saveSettings(); });
    $('#dmt-tr-auto').prop('checked', dmtSettings.trAuto).on('change', function () { dmtSettings.trAuto = this.checked; saveSettings(); });
    $('#dmt-rw-prompt').val(dmtSettings.rwPrompt || RW_PROMPT).on('input', function () { dmtSettings.rwPrompt = this.value === RW_PROMPT ? '' : this.value; saveSettings(); });
    $('#dmt-rw-reset').on('click', () => { dmtSettings.rwPrompt = ''; $('#dmt-rw-prompt').val(RW_PROMPT); saveSettings(); });
    $('#dmt-rw-examples').val(dmtSettings.rwExamples).on('input', function () { dmtSettings.rwExamples = String(this.value).slice(0, 12000); saveSettings(); });
    $('#dmt-tr-lang').val(dmtSettings.trLang).attr('placeholder', dmtSettings.language === 'ru' ? 'Russian' : 'English').on('input', function () { dmtSettings.trLang = String(this.value).slice(0, 40); saveSettings(); });
    $('#dmt-tr-prompt').val(dmtSettings.trPrompt || TR_PROMPT).on('input', function () { dmtSettings.trPrompt = this.value === TR_PROMPT ? '' : this.value; saveSettings(); });
    $('#dmt-tr-reset').on('click', () => { dmtSettings.trPrompt = ''; $('#dmt-tr-prompt').val(TR_PROMPT); saveSettings(); });
    $('#dmt-my-box').toggle(dmtSettings.myOn);
    $('#dmt-my-on').prop('checked', dmtSettings.myOn).on('change', function () { dmtSettings.myOn = this.checked; $('#dmt-my-box').toggle(this.checked); saveSettings(); mySync(); });
    $('#dmt-my-lang').val(dmtSettings.myLang).on('input', function () { dmtSettings.myLang = String(this.value).slice(0, 40); saveSettings(); mySync(); });
    $('#dmt-my-prompt').val(dmtSettings.myPrompt || MY_PROMPT).on('input', function () { dmtSettings.myPrompt = this.value === MY_PROMPT ? '' : this.value; saveSettings(); });
    $('#dmt-my-reset').on('click', () => { dmtSettings.myPrompt = ''; $('#dmt-my-prompt').val(MY_PROMPT); saveSettings(); });

    $('#dmt-inject-context').prop('checked', dmtSettings.injectContext).on('change', function () {
        dmtSettings.injectContext = this.checked;
        $('#dmt-inject-count-row').toggle(dmtSettings.injectContext);
        saveSettings();
        updateContextInjection();
    });
    $('#dmt-inject-count-row').toggle(dmtSettings.injectContext);

    $('#dmt-inject-count').val(dmtSettings.injectCount).on('change', function () {
        dmtSettings.injectCount = Math.max(1, parseInt($(this).val()) || 2);
        $(this).val(dmtSettings.injectCount);
        saveSettings();
        updateContextInjection();
    });

    $('#dmt-context-messages').val(dmtSettings.contextMessages).on('change', function () {
        dmtSettings.contextMessages = Math.max(2, parseInt($(this).val()) || 10);
        $(this).val(dmtSettings.contextMessages);
        saveSettings();
    });
}

/* ============================================================
   REWRITE & TRANSLATE — two buttons on a character's message.
   Rewrite: the second model rewrites the reply; the version you keep becomes the message itself
   (its text and its swipe), so the main model reads it from then on. Both versions are kept per
   swipe in extra.dmt_rw, and the small bar under the text switches between them or writes again.
   Translate: a translation shown in place of the text, only for reading — the message is untouched,
   so the main model always gets the original. Kept per swipe in extra.dmt_tr for the text it was made of.
   ============================================================ */
const rwBusy = new Set();     // `${chatId}#${id}#${swipe}#rw|tr`
function rwSwipe(msg) { return String(msg.swipe_id ?? 0); }
function rwRec(msg) { const r = msg && msg.extra && msg.extra.dmt_rw && msg.extra.dmt_rw[rwSwipe(msg)]; return r && typeof r.orig === 'string' && typeof r.alt === 'string' ? r : null; }
function trRec(msg) { const r = msg && msg.extra && msg.extra.dmt_tr && msg.extra.dmt_tr[rwSwipe(msg)]; return r && typeof r.out === 'string' && r.src === msg.mes ? r : null; }
function rwKey(id, msg, kind) { return `${getContext().chatId}#${id}#${rwSwipe(msg)}#${kind}`; }
function rwEligible(msg) { return !!(msg && !msg.is_user && !msg.is_system && String(msg.mes || '').trim()); }
// the message's text changes as if edited by hand: its swipe too, then the block, then the neighbours hear of it
function rwSetText(id, text) {
    const msg = getContext().chat[id];
    if (!msg) return;
    msg.mes = text;
    if (Array.isArray(msg.swipes) && msg.swipes.length > (msg.swipe_id ?? 0)) msg.swipes[msg.swipe_id ?? 0] = text;
    try { updateMessageBlock(id, msg); } catch (e) { console.warn('[DMT] redraw', e); }
    saveChatDebounced();
    try { eventSource.emit(event_types.MESSAGE_EDITED, id); eventSource.emit(event_types.MESSAGE_UPDATED, id); } catch (e) { }
    rwSync(id);
}
function cleanModelText(x) {
    return String(x || '').replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^\s*```[a-z]*\s*\n?/i, '').replace(/\n?```\s*$/, '').trim();
}
function rwBudget(text) { return Math.max(400, Math.min(6000, Math.round(String(text).length / 2.5) + 300)); }
async function rwRun(id) {
    const ctx = getContext(), msg = ctx.chat[id];
    if (!rwEligible(msg)) return;
    const key = rwKey(id, msg, 'rw');
    if (rwBusy.has(key)) return;
    const had = rwRec(msg);
    const orig = had ? had.orig : String(msg.mes);
    const chatId = ctx.chatId, swipe = rwSwipe(msg);
    rwBusy.add(key); rwSync(id);
    try {
        const ex = String(dmtSettings.rwExamples || '').trim();
        const sys = (dmtSettings.rwPrompt || RW_PROMPT) + (ex ? `\n\nExamples of the style:\n${ex}` : '');
        const out = cleanModelText(await callModel(sys, orig, rwBudget(orig), dmtSettings.temperature ?? 0.8));
        if (!out) throw new Error(t('err_empty'));
        const now = getContext();
        const m2 = now.chat[id];
        if (now.chatId !== chatId || !m2 || rwSwipe(m2) !== swipe) return;   // the chat or the swipe changed meanwhile
        if (!m2.extra) m2.extra = {};
        if (!m2.extra.dmt_rw || typeof m2.extra.dmt_rw !== 'object') m2.extra.dmt_rw = {};
        m2.extra.dmt_rw[swipe] = { orig, alt: out, on: true, at: Date.now() };
        rwSetText(id, out);
    } catch (e) {
        console.warn('[DMT] rewrite', e);
        toastr.error(t('err_prefix', { msg: e.message || String(e) }));
    } finally { rwBusy.delete(key); rwSync(id); }
}
function rwView(id, alt) {
    const msg = getContext().chat[id];
    const r = rwRec(msg);
    if (!r || r.on === !!alt) return;
    r.on = !!alt;
    rwSetText(id, alt ? r.alt : r.orig);
}
async function trRun(id, again = false) {
    const ctx = getContext(), msg = ctx.chat[id];
    if (!rwEligible(msg)) return;
    if (!again && trRec(msg)) { msg.extra.dmt_tr[rwSwipe(msg)].shown = true; saveChatDebounced(); rwSync(id); return; }
    const key = rwKey(id, msg, 'tr');
    if (rwBusy.has(key)) return;
    const src = String(msg.mes), chatId = ctx.chatId, swipe = rwSwipe(msg);
    const lang = String(dmtSettings.trLang || '').trim() || (dmtSettings.language === 'ru' ? 'Russian' : 'English');
    rwBusy.add(key); rwSync(id);
    try {
        const sys = String(dmtSettings.trPrompt || TR_PROMPT).split('{LANG}').join(lang);
        const out = cleanModelText(await callModel(sys, src, rwBudget(src) * 2, 0.3));
        if (!out) throw new Error(t('err_empty'));
        const now = getContext(), m2 = now.chat[id];
        if (now.chatId !== chatId || !m2 || rwSwipe(m2) !== swipe || m2.mes !== src) return;
        if (!m2.extra) m2.extra = {};
        if (!m2.extra.dmt_tr || typeof m2.extra.dmt_tr !== 'object') m2.extra.dmt_tr = {};
        m2.extra.dmt_tr[swipe] = { src, out, lang, shown: true, at: Date.now() };
        saveChatDebounced();
    } catch (e) {
        console.warn('[DMT] translate', e);
        toastr.error(t('err_prefix', { msg: e.message || String(e) }));
    } finally { rwBusy.delete(key); rwSync(id); }
}
function trHide(id) {
    const msg = getContext().chat[id];
    const r = trRec(msg);
    if (!r) return;
    msg.extra.dmt_tr[rwSwipe(msg)].shown = false;
    saveChatDebounced();
    rwSync(id);
}
// the buttons, the bar under the text and the translation of one message, as its state is now
function rwSync(id) {
    const el = document.querySelector(`#chat .mes[mesid="${Number(id)}"]`);
    if (!el) return;
    const msg = getContext().chat[id];
    const on = dmtSettings.rwOn && rwEligible(msg);
    const btns = el.querySelector('.mes_buttons');
    let rb = el.querySelector('.dmt-rw-btn'), tb = el.querySelector('.dmt-tr-btn');
    if (!on) { rb?.remove(); tb?.remove(); el.querySelector('.dmt-rw-bar')?.remove(); el.querySelector('.dmt-tr-box')?.remove(); el.querySelector('.mes_text')?.classList.remove('dmt-tr-hidden'); return; }
    if (btns && !rb) {
        rb = document.createElement('div'); rb.className = 'mes_button dmt-rw-btn fa-solid fa-feather-pointed'; rb.setAttribute('role', 'button'); rb.tabIndex = 0;
        tb = document.createElement('div'); tb.className = 'mes_button dmt-tr-btn fa-solid fa-language'; tb.setAttribute('role', 'button'); tb.tabIndex = 0;
        btns.prepend(tb); btns.prepend(rb);
    }
    const rwB = rwBusy.has(rwKey(id, msg, 'rw')), trB = rwBusy.has(rwKey(id, msg, 'tr'));
    if (rb) { const had = !!rwRec(msg); rb.classList.toggle('busy', rwB); rb.classList.toggle('on', had); rb.title = rwB ? t('rw_busy') : had ? `${t('rw_btn')}: ${t(rwRec(msg).on ? 'rw_show_orig' : 'rw_show_alt')}` : t('rw_btn'); rb.setAttribute('aria-label', rb.title); }
    if (tb) { tb.classList.toggle('busy', trB); tb.title = t(trB ? 'tr_busy' : 'tr_btn'); tb.setAttribute('aria-label', tb.title); }
    // the bar: which version stays, and once more
    const r = rwRec(msg);
    const textEl = el.querySelector('.mes_text');
    let bar = el.querySelector('.dmt-rw-bar');
    if (r && textEl) {
        if (!bar) { bar = document.createElement('div'); bar.className = 'dmt-rw-bar'; textEl.before(bar); }
        const sig = [r.on, rwB, dmtSettings.language].join('|');
        if (bar.dataset.sig !== sig) {
            bar.dataset.sig = sig;
            bar.innerHTML = `<span class="dmt-rw-tag"><i class="fa-solid fa-feather-pointed" aria-hidden="true"></i> ${escapeHtml(t('rw_tag'))}</span>
                <span class="dmt-rw-seg" role="group" title="${escapeHtml(t('rw_view_title'))}"><button type="button" data-rw-view="0" aria-pressed="${!r.on}">${escapeHtml(t('rw_show_orig'))}</button><button type="button" data-rw-view="1" aria-pressed="${!!r.on}">${escapeHtml(t('rw_show_alt'))}</button></span>
                <button type="button" class="dmt-rw-again" data-rw-again="1" title="${escapeHtml(t('rw_again_title'))}" ${rwB ? 'disabled' : ''}><i class="fa-solid ${rwB ? 'fa-spinner fa-spin' : 'fa-rotate'}" aria-hidden="true"></i> ${escapeHtml(t(rwB ? 'rw_busy' : 'rw_again'))}</button>`;
        }
    } else bar?.remove();
    // the translation, in place of the text
    const tr = trRec(msg);
    let box = el.querySelector('.dmt-tr-box');
    const showTr = !!(tr && tr.shown) || trB;
    if (showTr && textEl) {
        if (!box) { box = document.createElement('div'); box.className = 'dmt-tr-box'; textEl.after(box); }
        const sig = [tr ? tr.out : '', trB, dmtSettings.language].join('|');
        if (box.dataset.sig !== sig) {
            box.dataset.sig = sig;
            let body = '';
            if (tr) { try { body = messageFormatting(tr.out, msg.name, false, false, id); } catch (e) { body = escapeHtml(tr.out).replace(/\n/g, '<br>'); } }
            box.innerHTML = `<div class="dmt-tr-head"><span class="dmt-rw-tag"><i class="fa-solid fa-language" aria-hidden="true"></i> ${escapeHtml(t('tr_tag'))}</span><small>${escapeHtml(t('tr_note'))}</small>
                ${tr ? `<span class="dmt-tr-acts"><button type="button" data-tr-again="1" ${trB ? 'disabled' : ''}><i class="fa-solid ${trB ? 'fa-spinner fa-spin' : 'fa-rotate'}" aria-hidden="true"></i> ${escapeHtml(t('tr_again'))}</button><button type="button" data-tr-hide="1"><i class="fa-solid fa-eye-slash" aria-hidden="true"></i> ${escapeHtml(t('tr_hide'))}</button></span>` : ''}</div>
                <div class="dmt-tr-text">${tr && !trB ? body : `<span class="rpg-loading-dots">${escapeHtml(t('tr_busy'))}</span>`}</div>`;
        }
        textEl.classList.add('dmt-tr-hidden');
    } else { box?.remove(); textEl?.classList.remove('dmt-tr-hidden'); }
}
/* A new reply, by itself: rewritten first, then the version that stays is translated. Only replies that
   arrive now (a reply, a new swipe, a continuation); a reply that already has its rewrite or translation
   for this swipe is not asked again. */
const autoBusy = new Set();
async function rwAuto(id) {
    if (!dmtSettings.rwOn || (!dmtSettings.rwAuto && !dmtSettings.trAuto)) return;
    const ctx = getContext(), msg = ctx.chat[id];
    if (!rwEligible(msg)) return;
    const key = `${ctx.chatId}#${id}#${rwSwipe(msg)}`;
    if (autoBusy.has(key)) return;
    autoBusy.add(key);
    try {
        if (dmtSettings.rwAuto && !rwRec(msg)) await rwRun(id);
        const now = getContext(), m2 = now.chat[id];
        if (now.chatId !== ctx.chatId || !m2 || rwSwipe(m2) !== rwSwipe(msg)) return;   // the chat or the swipe changed meanwhile
        if (dmtSettings.trAuto && !trRec(m2)) {
            await trRun(id);
            // the text changed under it (the reply was still being finished, or another extension touched it)
            // or the server failed: once more, for the text as it is now
            const m3 = getContext().chat[id];
            if (getContext().chatId === ctx.chatId && m3 && rwSwipe(m3) === rwSwipe(msg) && !trRec(m3)) { await new Promise(r => setTimeout(r, 1500)); await trRun(id); }
        }
    } finally { autoBusy.delete(key); }
}

/* ============================================================
   MY MESSAGES — a button by the message box translates the player's own text before it is sent.
   The translation takes the text's place in the box; she looks and sends it herself (nothing is sent
   by the button, so nothing empty ever goes out). Pressed again while the translation is in the box,
   her own text comes back. If she types meanwhile, or the model answers nothing, her text stays.
   ============================================================ */
let myUndo = null;            // { orig, out } while the translation sits in the box
let myJob = null;             // { stop } while a translation is on its way
const myLang = () => String(dmtSettings.myLang || '').trim() || 'English';
function myBox() { return document.getElementById('send_textarea'); }
function mySetBox(v) {
    const ta = myBox(); if (!ta) return;
    ta.value = v;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    try { ta.focus(); ta.setSelectionRange(v.length, v.length); } catch (e) { }
}
function mySync() {
    let b = document.getElementById('dmt-my-tr');
    if (!dmtSettings.myOn) { if (b) b.remove(); myUndo = null; return; }
    const holder = document.getElementById('rightSendForm');
    if (!holder) return;
    if (!b) {
        b = document.createElement('div');
        b.id = 'dmt-my-tr';
        b.setAttribute('role', 'button');
        b.tabIndex = 0;
        b.addEventListener('click', myPress);
        // (the tavern also turns Enter on an "interactable" into a click: one press, not two)
        b.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); myPress(); } });
        holder.prepend(b);
    }
    const ta = myBox();
    if (myUndo && (!ta || ta.value !== myUndo.out)) myUndo = null;      // edited, sent or cleared: the way back is gone
    const state = myJob ? 'busy' : myUndo ? 'undo' : 'go';
    // a small coin like the suite's seal: "A / 文" to translate, an arrow to bring her text back
    const cls = 'interactable dmt-coin' + (state === 'busy' ? ' busy' : '') + (state === 'undo' ? ' undo' : '');
    if (b.className !== cls) b.className = cls;
    const face = state === 'undo' ? 'undo' : 'go';
    if (b.dataset.face !== face) {
        b.dataset.face = face;
        b.innerHTML = face === 'undo'
            ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>'
            : '<span class="dmt-coin-a" aria-hidden="true">A</span><span class="dmt-coin-sl" aria-hidden="true"></span><span class="dmt-coin-z" aria-hidden="true">文</span>';
    }
    const tip = state === 'busy' ? t('my_busy') : state === 'undo' ? t('my_undo') : t('my_btn', { LANG: myLang() });
    if (b.title !== tip) { b.title = tip; b.setAttribute('aria-label', tip); }
    b.setAttribute('aria-busy', String(state === 'busy'));
}
async function myPress() {
    const ta = myBox(); if (!ta) return;
    if (myJob) { myJob.stop = true; myJob = null; mySync(); return; }          // stop waiting; the late answer is dropped
    if (myUndo && ta.value === myUndo.out) { const o = myUndo.orig; myUndo = null; mySetBox(o); mySync(); return; }
    const src = ta.value;
    if (!src.trim()) { toastr.info(t('my_empty')); return; }
    const job = { stop: false }; myJob = job; mySync();
    try {
        const sys = String(dmtSettings.myPrompt || MY_PROMPT).split('{LANG}').join(myLang());
        const out = cleanModelText(await callModel(sys, src, rwBudget(src) * 2, 0.3));
        if (job.stop) return;
        if (!out) throw new Error(t('err_empty'));
        if (ta.value !== src) { toastr.info(t('my_changed')); return; }
        mySetBox(out);
        myUndo = { orig: src, out };
    } catch (e) {
        if (job.stop) return;
        console.warn('[DMT] translate my text', e);
        toastr.error(t('err_prefix', { msg: e.message || String(e) }));
    } finally { if (myJob === job) myJob = null; mySync(); }
}
function rwSyncAll() { document.querySelectorAll('#chat .mes[mesid]').forEach(el => rwSync(Number(el.getAttribute('mesid')))); }
// a hand edit after a rewrite: the edited text becomes the version on screen
function rwEdited(id) {
    const msg = getContext().chat[id];
    const r = rwRec(msg);
    if (r && msg.mes !== r.orig && msg.mes !== r.alt) { if (r.on) r.alt = msg.mes; else r.orig = msg.mes; saveChatDebounced(); }
    rwSync(id);
}
function rwBind() {
    const chat = document.getElementById('chat');
    if (!chat || chat.dataset.dmtRw) return;
    chat.dataset.dmtRw = '1';
    const act = e => {
        const mes = e.target.closest('.mes[mesid]');
        if (!mes) return false;
        const id = Number(mes.getAttribute('mesid'));
        const b = e.target.closest('.dmt-rw-btn, .dmt-tr-btn, [data-rw-view], [data-rw-again], [data-tr-again], [data-tr-hide]');
        if (!b || !mes.contains(b) || b.disabled) return false;
        e.preventDefault(); e.stopPropagation();
        if (b.classList.contains('dmt-rw-btn')) { const r = rwRec(getContext().chat[id]); if (r) rwView(id, !r.on); else rwRun(id); }
        else if (b.classList.contains('dmt-tr-btn')) { const tr = trRec(getContext().chat[id]); if (tr && tr.shown) trHide(id); else trRun(id); }
        else if (b.dataset.rwView !== undefined) rwView(id, b.dataset.rwView === '1');
        else if (b.dataset.rwAgain) rwRun(id);
        else if (b.dataset.trAgain) trRun(id, true);
        else if (b.dataset.trHide) trHide(id);
        return true;
    };
    chat.addEventListener('click', e => { act(e); }, true);
    chat.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest?.('.dmt-rw-btn, .dmt-tr-btn')) act(e); }, true);
}

function restoreThoughtsOnLoad() {
    if (!dmtSettings.enabled) return;
    const context = getContext();
    if (!context.chat) return;

    context.chat.forEach((msg, idx) => {
        if (msg.extra?.dmt_thoughts) {
            for (const [charName, thought] of Object.entries(msg.extra.dmt_thoughts)) {
                renderThought(idx, charName, thought, false, false, true);
            }
        }
    });
    updateContextInjection();
}

jQuery(() => {
    try {
        loadSettings();
        mountSettings();
        initDmtLayer();

        const chatElement = document.getElementById('chat');
        if (chatElement) {
            chatElement.addEventListener('scroll', syncBubbles, { passive: true });
        }
        window.addEventListener('resize', syncBubbles, { passive: true });

        // Attributes are not watched any more. With subtree:true, every hover class and
        // every inline style SillyTavern touches anywhere in the chat woke the whole
        // repositioning pass — and it touches them constantly while a reply streams.
        // Messages appearing and disappearing is what actually moves bubbles, and that
        // is childList.
        const observer = new MutationObserver(syncBubbles);
        if (chatElement) {
            observer.observe(chatElement, { childList: true, subtree: true });
        }

        rwBind();
        setTimeout(rwSyncAll, 1500);
        mySync(); setTimeout(mySync, 1500);
        $(document).on('input', '#send_textarea', () => { if (myUndo) mySync(); });
        eventSource.on(event_types.MESSAGE_SENT, () => setTimeout(mySync, 0));
        const rwLater = id => setTimeout(() => rwSync(id), 0);
        eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, rwLater);
        eventSource.on(event_types.MESSAGE_SWIPED, rwLater);
        eventSource.on(event_types.MESSAGE_UPDATED, rwLater);
        eventSource.on(event_types.MESSAGE_EDITED, id => setTimeout(() => rwEdited(id), 0));
        eventSource.on(event_types.MESSAGE_DELETED, () => setTimeout(rwSyncAll, 0));
        // a continued reply grew past its rewrite: the grown text is the version on screen (as after a hand edit)
        eventSource.on(event_types.MESSAGE_RECEIVED, (id) => setTimeout(() => { rwEdited(Number(id)); rwAuto(Number(id)); }, 120));
        if (event_types.MORE_MESSAGES_LOADED) eventSource.on(event_types.MORE_MESSAGES_LOADED, () => setTimeout(rwSyncAll, 0));
        eventSource.on(event_types.CHAT_CHANGED, () => {
            setTimeout(rwSyncAll, 0); setTimeout(rwSyncAll, 600);
            myUndo = null; setTimeout(mySync, 0);
            renderCharBox();
            document.querySelectorAll('.rpg-thought-bubble').forEach(b => b.remove());
            bubblesMap.clear();
            restoreThoughtsOnLoad();
        });

        eventSource.on(event_types.CHARACTER_MESSAGE_RENDERED, (messageId) => {
            if (!dmtSettings.enabled) return;
            const msg = getContext().chat[messageId];
            if (msg && !msg.is_user && !msg.is_system && msg.extra?.dmt_thoughts?.[msg.name]) {
                renderThought(messageId, msg.name, msg.extra.dmt_thoughts[msg.name]);
            }
        });

        eventSource.on(event_types.MESSAGE_EDITED, (messageId) => {
            if (!dmtSettings.enabled) return;
            const msg = getContext().chat[messageId];
            if (msg && !msg.is_user && !msg.is_system && msg.extra?.dmt_thoughts?.[msg.name]) {
                renderThought(messageId, msg.name, msg.extra.dmt_thoughts[msg.name]);
            }
        });

        eventSource.on(event_types.MESSAGE_RECEIVED, async (messageId) => {
            const msg = getContext().chat[messageId];
            if (msg && !msg.is_user && !msg.is_system) {
                setTimeout(async () => await handleMessage(messageId), 50);
            }
        });

        eventSource.on(event_types.MESSAGE_SWIPED, async (messageId) => {
            const msg = getContext().chat[messageId];
            if (msg && !msg.is_user && !msg.is_system) {
                setTimeout(async () => await handleMessage(messageId), 50);
            }
        });

    } catch (e) {
        console.error("[DMT Thoughts] Fatal Initialization Error:", e);
    }
});
