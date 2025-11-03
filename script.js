// ---- Font and Size Setup ----
const Font = Quill.import('formats/font');
Font.whitelist = [
  { value: 'times-new-roman', name: 'Times New Roman' },
  { value: 'georgia', name: 'Georgia' },
  { value: 'garamond', name: 'Garamond' },
  { value: 'arial', name: 'Arial' },
  { value: 'helvetica', name: 'Helvetica' },
  { value: 'verdana', name: 'Verdana' },
  { value: 'roboto', name: 'Roboto' },
  { value: 'open-sans', name: 'Open Sans' },
  { value: 'impact', name: 'Impact' },
  { value: 'playfair-display', name: 'Playfair Display' },
  { value: 'bebas-neue', name: 'Bebas Neue' },
  { value: 'courier-new', name: 'Courier New' },
  { value: 'consolas', name: 'Consolas' },
  { value: 'dancing-script', name: 'Dancing Script' },
  { value: 'caveat', name: 'Caveat' }
];
const FontAttributor = Quill.import('attributors/style/font');
FontAttributor.whitelist = Font.whitelist.map(font => font.value);
Quill.register(FontAttributor, true);

// Font sizes
const fontSizes = [
  { value: '10px', label: 'Smallest' },
  { value: '12px', label: 'Smaller' },
  { value: '14px', label: 'Small' },
  { value: '16px', label: 'Normal' },
  { value: '20px', label: 'Big' },
  { value: '24px', label: 'Bigger' },
  { value: '30px', label: 'Huge' },
  { value: '36px', label: 'Giant' },
  { value: '48px', label: 'Massive' },
  { value: '60px', label: 'Titanic' }
];
const Size = Quill.import('attributors/style/size');
Size.whitelist = fontSizes.map(s => s.value);
Quill.register(Size, true);

// ---- Quill Editors ----
const titleEditor = new Quill('#title-editor', {
  theme: 'snow',
  placeholder: 'Note Title',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }],
      [{ 'font': Font.whitelist.map(font => font.value) }],
      [{ 'size': fontSizes.map(s => s.value) }]
    ]
  }
});

const textEditor = new Quill('#text-editor', {
  theme: 'snow',
  placeholder: 'Write your note here...',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      [{ 'font': Font.whitelist.map(font => font.value) }],
      [{ 'size': fontSizes.map(s => s.value) }]
    ]
  }
});

// Edit modal editors
const editTitleEditor = new Quill('#edit-title-editor', {
  theme: 'snow',
  placeholder: 'Note Title',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }],
      [{ 'font': Font.whitelist.map(font => font.value) }],
      [{ 'size': fontSizes.map(s => s.value) }]
    ]
  }
});

const editTextEditor = new Quill('#edit-text-editor', {
  theme: 'snow',
  placeholder: 'Write your note here...',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      [{ 'font': Font.whitelist.map(font => font.value) }],
      [{ 'size': fontSizes.map(s => s.value) }]
    ]
  }
});

// ---- Custom Dropdown Display Logic ----
function updatePickerLabels() {
  document.querySelectorAll('.ql-font .ql-picker-item, .ql-font .ql-picker-label').forEach(item => {
    const value = item.getAttribute('data-value') || 'arial';
    const font = Font.whitelist.find(f => f.value === value) || Font.whitelist.find(f => f.value === 'arial');
    if (font) {
      item.setAttribute('data-label', font.name);
      item.textContent = font.name;
    }
  });
  document.querySelectorAll('.ql-size .ql-picker-item, .ql-size .ql-picker-label').forEach(item => {
    const value = item.getAttribute('data-value') || '16px';
    const size = fontSizes.find(s => s.value === value) || fontSizes.find(s => s.value === '16px');
    if (size) {
      item.setAttribute('data-label', size.label);
      item.textContent = size.label;
    }
  });
}
setTimeout(updatePickerLabels, 500);

// ---- DOM References ----
const addNoteButton = document.getElementById('addNote');
const notesDiv = document.getElementById('notes');
const imageInput = document.getElementById('image-input');

const editPopup = document.getElementById('edit-popup');
const editImageInput = document.getElementById('edit-image-input');
const editPreviewImage = document.getElementById('edit-preview-image');
const saveEditBtn = document.getElementById('save-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');

let editingIndex = -1;
let currentImageDataUrl = '';

// ---- Utils ----
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Create a safe plain-text title from stored HTML
function getPlainTextTitle(html) {
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  const div = document.createElement('div');
  div.innerHTML = clean;
  const text = (div.textContent || div.innerText || '').trim();
  return text || 'Note';
}

// ---- Storage ----
function getNotes() {
  try {
    const notes = localStorage.getItem('notes');
    return notes ? JSON.parse(notes) : [];
  } catch (e) {
    console.error('Error accessing localStorage:', e);
    return [];
  }
}
function saveNotes(notes) {
  try {
    localStorage.setItem('notes', JSON.stringify(notes));
  } catch (e) {
    console.error('Error saving to localStorage:', e);
  }
}

// ---- CRUD ----
function addNotes() {
  let notes = getNotes();
  const noteTitle = titleEditor.root.innerHTML;
  const noteText = textEditor.root.innerHTML;

  if (noteTitle.trim() === '<p><br></p>' || noteText.trim() === '<p><br></p>') {
    alert('Please enter both a title and content for the note.');
    return;
  }

  const noteObj = {
    title: DOMPurify.sanitize(noteTitle, { USE_PROFILES: { html: true } }),
    text: DOMPurify.sanitize(noteText, { USE_PROFILES: { html: true } }),
    image: currentImageDataUrl || null
  };

  notes.push(noteObj);
  saveNotes(notes);

  // Reset
  titleEditor.root.innerHTML = '';
  textEditor.root.innerHTML = '';
  imageInput.value = '';
  currentImageDataUrl = '';

  showNotes();
}

function deleteNote(index) {
  if (confirm('Are you sure you want to delete this note?')) {
    const notes = getNotes();
    notes.splice(index, 1);
    saveNotes(notes);
    showNotes();
  }
}

// ---- Expand View ----
function openExpandedView(note) {
  // Sanitize content before injecting into new window
  const safeTitle = DOMPurify.sanitize(note.title, { USE_PROFILES: { html: true } });
  const safeBody  = DOMPurify.sanitize(note.text,  { USE_PROFILES: { html: true } });
  const imgHtml = note.image
    ? `<img src="${note.image}" alt="Note image" style="max-width:100%;height:auto;border-radius:8px;margin:12px 0;">`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Note Preview</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, Segoe UI, Roboto, Open Sans, Arial, sans-serif; margin: 0; padding: 24px; line-height: 1.6; color: #111827; background: #f9fafb; }
          .container { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); padding: 28px; }
          .title { font-size: 1.6rem; font-weight: 700; color: #0f172a; margin-bottom: 6px; }
          .divider { height: 1px; background: #e5e7eb; margin: 16px 0 20px; border: 0; }
          .content { font-size: 1rem; color: #1f2937; }
          .toolbar { position: sticky; top: 0; background: #f9fafb; padding: 10px 0; margin: -24px -24px 16px; border-bottom: 1px solid #e5e7eb; display: flex; gap: 8px; justify-content: flex-end; }
          .btn { background:#111827; color:#fff; border:none; border-radius:6px; padding:8px 12px; cursor:pointer; }
          .btn:hover { background:#000; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="toolbar">
            <button class="btn" onclick="window.print()">Print</button>
            <button class="btn" onclick="window.close()">Close</button>
          </div>
          <div class="title">${safeTitle}</div>
          <hr class="divider">
          ${imgHtml}
          <div class="content">${safeBody}</div>
        </div>
      </body>
    </html>
  `;

  // Open in a large external window using a Blob URL
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer,width=1100,height=800'); // large view
}
// ---- End Expand View ----

// Render preview: image + title only (+ actions)
function showNotes() {
  const notes = getNotes();
  notesDiv.innerHTML = '';

  notes.forEach((note, index) => {
    const card = document.createElement('div');
    card.className = 'note card-preview';

    const titleText = getPlainTextTitle(note.title);
    const imgHtml = note.image
      ? `<img src="${note.image}" alt="Note image" class="note-image preview-img">`
      : '';

    card.innerHTML = `
      ${imgHtml}
      <div class="note-header preview-title">${DOMPurify.sanitize(titleText)}</div>
      <div class="note-actions">
        <button class="expand-btn" aria-label="Expand note">Expand</button>
        <button class="edit-btn" aria-label="Edit note">Edit</button>
        <button class="deleteNote" aria-label="Delete note">Delete</button>
      </div>
    `;

    // Expand
    card.querySelector('.expand-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const current = getNotes()[index];
      if (current) openExpandedView(current);
    });

    // Edit
    card.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openEditModal(index);
    });

    // Delete
    card.querySelector('.deleteNote').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteNote(index);
    });

    // Optional: click card to edit
    card.addEventListener('click', () => openEditModal(index));

    notesDiv.appendChild(card);
  });
}

// ---- Edit Modal ----
function openEditModal(index) {
  const notes = getNotes();
  const note = notes[index];
  if (!note) return;

  editingIndex = index;

  editTitleEditor.root.innerHTML = note.title;
  editTextEditor.root.innerHTML = note.text;

  currentImageDataUrl = note.image || '';
  if (note.image) {
    editPreviewImage.src = note.image;
    editPreviewImage.style.display = 'block';
  } else {
    editPreviewImage.style.display = 'none';
  }

  editPopup.style.display = 'flex';
  setTimeout(updatePickerLabels, 100);
}

function closeEditModal() {
  editPopup.style.display = 'none';
  editingIndex = -1;
  currentImageDataUrl = '';
  editImageInput.value = '';
  editPreviewImage.src = '';
}

function saveEditedNote() {
  if (editingIndex < 0) return;

  const notes = getNotes();
  const updatedTitle = editTitleEditor.root.innerHTML;
  const updatedText = editTextEditor.root.innerHTML;

  if (updatedTitle.trim() === '<p><br></p>' || updatedText.trim() === '<p><br></p>') {
    alert('Title and content cannot be empty.');
    return;
  }

  notes[editingIndex] = {
    title: DOMPurify.sanitize(updatedTitle, { USE_PROFILES: { html: true } }),
    text: DOMPurify.sanitize(updatedText, { USE_PROFILES: { html: true } }),
    image: currentImageDataUrl
  };

  saveNotes(notes);
  showNotes();
  closeEditModal();
}

// ---- Events ----
addNoteButton.addEventListener('click', addNotes);
saveEditBtn.addEventListener('click', saveEditedNote);
cancelEditBtn.addEventListener('click', closeEditModal);

imageInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      currentImageDataUrl = await fileToBase64(file);
    } catch (error) {
      console.error('Error converting image to base64:', error);
      alert('Error uploading image.');
    }
  }
});

editImageInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    try {
      currentImageDataUrl = await fileToBase64(file);
      editPreviewImage.src = currentImageDataUrl;
      editPreviewImage.style.display = 'block';
    } catch (error) {
      console.error('Error converting image to base64:', error);
      alert('Error uploading image.');
    }
  }
});

// Initial render
showNotes();
