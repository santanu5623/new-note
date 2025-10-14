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

// Override the font attributor to use display names
const FontAttributor = Quill.import('attributors/style/font');
FontAttributor.whitelist = Font.whitelist.map(font => font.value);
Quill.register(FontAttributor, true);

// Initialize Quill editors for main input
const titleEditor = new Quill('#title-editor', {
    theme: 'snow',
    placeholder: 'Note Title',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'color': [] }],
            [{ 'font': Font.whitelist.map(font => font.value) }]
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
            [{ 'font': Font.whitelist.map(font => font.value) }]
        ]
    }
});

// Initialize Quill editors for edit popup
const editTitleEditor = new Quill('#edit-title-editor', {
    theme: 'snow',
    placeholder: 'Note Title',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'color': [] }],
            [{ 'font': Font.whitelist.map(font => font.value) }]
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
            [{ 'font': Font.whitelist.map(font => font.value) }]
        ]
    }
});

// Customize the font dropdown display names
document.querySelectorAll('.ql-font .ql-picker-item').forEach(item => {
    const value = item.getAttribute('data-value');
    const font = Font.whitelist.find(f => f.value === value);
    if (font) {
        item.setAttribute('data-label', font.name);
        item.textContent = font.name;
    }
});

// DOM elements
const addNoteButton = document.getElementById('addNote');
const notesDiv = document.getElementById('notes');
const notePopup = document.getElementById('notePopup');
const popupTitle = notePopup.querySelector('.modal-title');
const popupText = notePopup.querySelector('.modal-body');
const closeBtn = notePopup.querySelector('.close-modal');
const imageInput = document.getElementById('image-input');

const editPopup = document.getElementById('editPopup');
const updateNoteButton = document.getElementById('updateNote');
const editImageInput = document.getElementById('edit-image-input');
const editCloseBtn = editPopup.querySelector('.close-modal');

// Track editing state
let editingIndex = -1;
let currentImageDataUrl = '';

// Function to convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Load and show notes on page load
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
    } else {
        notes.push(noteObj);
    }

    saveNotes(notes);
    titleEditor.root.innerHTML = '';
    textEditor.root.innerHTML = '';
    addNoteButton.textContent = 'Add Note';
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
        noteElement.innerHTML = `
            <div class="note-header">${DOMPurify.sanitize(title)}</div>
            ${imageHtml}
            <div class="text">${DOMPurify.sanitize(note.text)}</div>
            <div class="note-actions">
                <button class="expand-btn" aria-label="Expand note">Expand</button>
                <button class="edit-btn" aria-label="Edit note">Edit</button>
                <button class="deleteNote" aria-label="Delete note">Delete</button>
            </div>
        `;

        // Event listeners for buttons
        noteElement.querySelector('.expand-btn').addEventListener('click', () => expandNote(index));
        noteElement.querySelector('.edit-btn').addEventListener('click', () => openEditPopup(index));
        noteElement.querySelector('.deleteNote').addEventListener('click', () => deleteNote(index));

        notesDiv.appendChild(noteElement);
    });

    // Re-apply font dropdown labels after notes are rendered
    document.querySelectorAll('.ql-font .ql-picker-item').forEach(item => {
        const value = item.getAttribute('data-value');
        const font = Font.whitelist.find(f => f.value === value);
        if (font) {
            item.setAttribute('data-label', font.name);
            item.textContent = font.name;
        }
    });
}

function deleteNote(index) {
    if (confirm('Are you sure you want to delete this note?')) {
        const notes = getNotes();
        notes.splice(index, 1);
        saveNotes(notes);
        showNotes();
    }
}

function expandNote(index) {
    const notes = getNotes();
    if (!notes[index]) return;
    const note = notes[index];
    popupTitle.innerHTML = DOMPurify.sanitize(note.title === '<p><br></p>' || !note.title ? 'Note' : note.title);
    let textHtml = DOMPurify.sanitize(note.text);
    if (note.image) {
        textHtml = `<img src="${note.image}" alt="Note image" class="note-image">` + textHtml;
    }
    popupText.innerHTML = textHtml;
    notePopup.style.display = 'flex';
}

function openEditPopup(index) {
    const notes = getNotes();
    if (!notes[index]) return;
    const note = notes[index];
    editTitleEditor.root.innerHTML = note.title;
    editTextEditor.root.innerHTML = note.text;
    currentImageDataUrl = note.image || '';
    if (note.image) {
        editImageInput.value = '';
    }
    editingIndex = index;
    updateNoteButton.textContent = 'Update Note';
    editPopup.style.display = 'flex';

    // Re-apply font dropdown labels for edit popup
    document.querySelectorAll('.ql-font .ql-picker-item').forEach(item => {
        const value = item.getAttribute('data-value');
        const font = Font.whitelist.find(f => f.value === value);
        if (font) {
            item.setAttribute('data-label', font.name);
            item.textContent = font.name;
        }
    });
}

function updateNote() {
    const notes = getNotes();
    const noteTitle = editTitleEditor.root.innerHTML;
    const noteText = editTextEditor.root.innerHTML;

    if (noteTitle === '<p><br></p>' || noteText === '<p><br></p>') {
        alert('Please enter both a title and content for the note.');
        return;
    }

    const noteObj = {
        title: DOMPurify.sanitize(noteTitle),
        text: DOMPurify.sanitize(noteText),
        image: currentImageDataUrl || null,
    };

    notes[editingIndex] = noteObj;
    saveNotes(notes);
    editTitleEditor.root.innerHTML = '';
    editTextEditor.root.innerHTML = '';
    currentImageDataUrl = '';
    editImageInput.value = '';
    editingIndex = -1;
    editPopup.style.display = 'none';
    showNotes();
}

closeBtn.addEventListener('click', () => {
    notePopup.style.display = 'none';
});

notePopup.addEventListener('click', (e) => {
    if (e.target === notePopup) {
        notePopup.style.display = 'none';
    }
});

editCloseBtn.addEventListener('click', () => {
    editPopup.style.display = 'none';
});

editPopup.addEventListener('click', (e) => {
    if (e.target === editPopup) {
        editPopup.style.display = 'none';
    }
});

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
updateNoteButton.addEventListener('click', updateNote);