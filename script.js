// ---- Font and Size Setup ----

// Register custom fonts with Quill
const Font = Quill.import('formats/font');
// Set the whitelist of fonts with their display names
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

// ---- FONT SIZE: Use descriptive, bigger range ----
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
    // Font labels
    document.querySelectorAll('.ql-font .ql-picker-item').forEach(item => {
        const value = item.getAttribute('data-value');
        const font = Font.whitelist.find(f => f.value === value);
        if (font) {
            item.setAttribute('data-label', font.name);
            item.textContent = font.name;
        }
    });
    // Size labels
    document.querySelectorAll('.ql-size .ql-picker-item').forEach(item => {
        const value = item.getAttribute('data-value');
        const size = fontSizes.find(s => s.value === value);
        if (size) {
            item.setAttribute('data-label', size.label);
            item.textContent = size.label;
        }
    });
}
// Always call this after editor initialization:
setTimeout(updatePickerLabels, 500);

// ---- Your existing DOM references ----
const addNoteButton = document.getElementById('addNote');
const notesDiv = document.getElementById('notes');
const imageInput = document.getElementById('image-input');
const editImageInput = document.getElementById('edit-image-input');

let editingIndex = -1;
let currentImageDataUrl = '';

// Convert file to Base64 for image storage
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

showNotes();

function addNotes() {
    let notes = getNotes();
    const noteTitle = titleEditor.root.innerHTML;
    const noteText = textEditor.root.innerHTML;

    if (noteTitle === '<p><br></p>' || noteText === '<p><br></p>') {
        alert('Please enter both a title and content for the note.');
        return;
    }

    const noteObj = {
        title: DOMPurify.sanitize(noteTitle),
        text: DOMPurify.sanitize(noteText),
        image: currentImageDataUrl || null,
    };

    if (editingIndex >= 0) {
        notes[editingIndex] = noteObj;
        editingIndex = -1;
        currentImageDataUrl = '';
        imageInput.value = '';
        addNoteButton.textContent = 'Add Note';
    } else {
        notes.push(noteObj);
    }

    saveNotes(notes);
    titleEditor.root.innerHTML = '';
    textEditor.root.innerHTML = '';
    showNotes();
}

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

function showNotes() {
    const notes = getNotes();
    notesDiv.innerHTML = '';

    notes.forEach((note, index) => {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        const title = note.title === '<p><br></p>' || !note.title ? 'Note' : note.title;
        let imageHtml = '';
        if (note.image) {
            imageHtml = `<img src="${note.image}" alt="Note image" class="note-image">`;
        }
        // Sanitize text preview to avoid HTML injection in preview
        let textPreview = note.text === '<p><br></p>' ? '' : DOMPurify.sanitize(note.text);
        noteElement.innerHTML = `
            <div class="note-header">${DOMPurify.sanitize(title)}</div>
            ${imageHtml}
            <div class="text">${textPreview}</div>
            <div class="note-actions">
                <button class="expand-btn" aria-label="Expand note">Expand</button>
                <button class="edit-btn" aria-label="Edit note">Edit</button>
                <button class="deleteNote" aria-label="Delete note">Delete</button>
            </div>
        `;
        noteElement.querySelector('.expand-btn').addEventListener('click', () => expandNote(index));
        noteElement.querySelector('.edit-btn').addEventListener('click', () => openEditPopup(index));
        noteElement.querySelector('.deleteNote').addEventListener('click', () => deleteNote(index));
        notesDiv.appendChild(noteElement);
    });

    updatePickerLabels();
}

function deleteNote(index) {
    if (confirm('Are you sure you want to delete this note?')) {
        const notes = getNotes();
        notes.splice(index, 1);
        saveNotes(notes);
        showNotes();
    }
}

// Modified expandNote to open new window with full note details
function expandNote(index) {
    const notes = getNotes();
    if (!notes[index]) return;
    const note = notes[index];

    const title = note.title === '<p><br></p>' || !note.title ? 'Note' : note.title;
    const imageHtml = note.image ? `<img src="${note.image}" alt="Note image" style="max-width: 100%; height: auto; margin-bottom: 1em;">` : '';
    const textHtml = note.text || '';

    const popupHtml = `
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.5; }
                img { max-width: 100%; height: auto; border: 1px solid #ccc; padding: 4px; }
                h2 { margin-bottom: 0.5em; }
            </style>
        </head>
        <body>
            <h2>${title}</h2>
            ${imageHtml}
            <div>${textHtml}</div>
        </body>
        </html>
    `;

    const win = window.open('', '_blank', 'width=600,height=600,scrollbars=yes,resizable=yes');
    win.document.open();
    win.document.write(popupHtml);
    win.document.close();
}

// Modified openEditPopup to open new window with simple textareas for editing and save to localStorage
function openEditPopup(index) {
    const notes = getNotes();
    if (!notes[index]) return;
    const note = notes[index];

    const title = note.title === '<p><br></p>' || !note.title ? '' : note.title;
    const text = note.text === '<p><br></p>' || !note.text ? '' : note.text;
    const image = note.image || '';

    const popupHtml = `
        <html>
        <head>
            <title>Edit Note</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                label { font-weight: bold; display: block; margin-top: 1em; }
                textarea { width: 100%; box-sizing: border-box; padding: 8px; font-family: Arial, sans-serif; font-size: 14px; }
                button { margin-top: 1em; padding: 8px 16px; font-size: 14px; cursor: pointer; }
                img { max-width: 100%; height: auto; margin-top: 1em; border: 1px solid #ccc; padding: 4px; }
            </style>
        </head>
        <body>
            <h2>Edit Note</h2>
            <label for="titleInput">Title (HTML allowed):</label>
            <textarea id="titleInput" rows="3" placeholder="Note Title">${title}</textarea>

            <label for="textInput">Content (HTML allowed):</label>
            <textarea id="textInput" rows="10" placeholder="Write your note content here...">${text}</textarea>

            ${image ? `<label>Current Image:</label><img src="${image}" alt="Note image">` : ''}

            <button id="saveBtn">Save</button>
            <button id="cancelBtn">Cancel</button>

            <script>
                const saveBtn = document.getElementById('saveBtn');
                const cancelBtn = document.getElementById('cancelBtn');
                saveBtn.onclick = () => {
                    const updatedTitle = document.getElementById('titleInput').value;
                    const updatedText = document.getElementById('textInput').value;
                    if (!updatedTitle.trim() || !updatedText.trim()) {
                        alert('Please enter both title and content.');
                        return;
                    }
                    try {
                        const notes = JSON.parse(localStorage.getItem('notes')) || [];
                        notes[${index}] = {
                            title: updatedTitle,
                            text: updatedText,
                            image: '${image.replace(/'/g, "\\'")}'
                        };
                        localStorage.setItem('notes', JSON.stringify(notes));
                        alert('Note updated successfully!');
                        window.close();
                    } catch (e) {
                        alert('Error saving note.');
                    }
                };
                cancelBtn.onclick = () => { window.close(); };
            </script>
        </body>
        </html>
    `;

    const win = window.open('', '_blank', 'width=700,height=600,scrollbars=yes,resizable=yes');
    win.document.open();
    win.document.write(popupHtml);
    win.document.close();
}

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
        } catch (error) {
            console.error('Error converting image to base64:', error);
            alert('Error uploading image.');
        }
    }
});

addNoteButton.addEventListener('click', addNotes);
