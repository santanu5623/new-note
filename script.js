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

// For Adding Notes
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

// For Editing Notes (in the modal)
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
        const value = item.getAttribute('data-value') || 'arial'; // Default to arial
        const font = Font.whitelist.find(f => f.value === value) || Font.whitelist.find(f => f.value === 'arial');
        if (font) {
            item.setAttribute('data-label', font.name);
            item.textContent = font.name;
        }
    });
    document.querySelectorAll('.ql-size .ql-picker-item, .ql-size .ql-picker-label').forEach(item => {
        const value = item.getAttribute('data-value') || '16px'; // Default to normal
        const size = fontSizes.find(s => s.value === value) || fontSizes.find(s => s.value === '16px');
        if (size) {
            item.setAttribute('data-label', size.label);
            item.textContent = size.label;
        }
    });
}
setTimeout(updatePickerLabels, 500); // Delay to ensure editors are ready


// ---- DOM References ----
const addNoteButton = document.getElementById('addNote');
const notesDiv = document.getElementById('notes');
const imageInput = document.getElementById('image-input');

// Edit Modal DOM References
const editPopup = document.getElementById('edit-popup');
const editImageInput = document.getElementById('edit-image-input');
const editPreviewImage = document.getElementById('edit-preview-image');
const saveEditBtn = document.getElementById('save-edit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');


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

// ---- CRUD Functions (Create, Read, Update, Delete) ----

function addNotes() {
    let notes = getNotes();
    const noteTitle = titleEditor.root.innerHTML;
    const noteText = textEditor.root.innerHTML;

    if (noteTitle.trim() === '<p><br></p>' || noteText.trim() === '<p><br></p>') {
        alert('Please enter both a title and content for the note.');
        return;
    }

    const noteObj = {
        title: DOMPurify.sanitize(noteTitle),
        text: DOMPurify.sanitize(noteText),
        image: currentImageDataUrl || null,
    };

    notes.push(noteObj);
    saveNotes(notes);

    // Reset fields
    titleEditor.root.innerHTML = '';
    textEditor.root.innerHTML = '';
    imageInput.value = '';
    currentImageDataUrl = '';

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
        let imageHtml = note.image ? `<img src="${note.image}" alt="Note image" class="note-image">` : '';

        // Sanitize text preview to avoid HTML injection
        let textPreview = note.text === '<p><br></p>' ? '' : note.text;
        
        noteElement.innerHTML = `
            <div class="note-header">${title}</div>
            ${imageHtml}
            <div class="text">${textPreview}</div>
            <div class="note-actions">
                <button class="expand-btn" aria-label="Expand note">Expand</button>
                <button class="edit-btn" aria-label="Edit note">Edit</button>
                <button class="deleteNote" aria-label="Delete note">Delete</button>
            </div>
        `;
        noteElement.querySelector('.expand-btn').addEventListener('click', () => expandNote(index));
        noteElement.querySelector('.edit-btn').addEventListener('click', () => openEditModal(index));
        noteElement.querySelector('.deleteNote').addEventListener('click', () => deleteNote(index));
        notesDiv.appendChild(noteElement);
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
    const note = getNotes()[index];
    if (!note) return;

    const title = note.title === '<p><br></p>' || !note.title ? 'Note' : note.title;
    const imageHtml = note.image ? `<img src="${note.image}" alt="Note image" style="max-width: 100%; height: auto; margin-bottom: 1em;">` : '';
    const textHtml = note.text || '';

    const popupHtml = `
        <html>
        <head>
            <title>${document.title} - Note</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.5; }
                img { max-width: 100%; height: auto; border: 1px solid #ccc; padding: 4px; border-radius: 4px; }
            </style>
        </head>
        <body>
            <div>${title}</div>
            <hr>
            ${imageHtml}
            <div>${textHtml}</div>
        </body>
        </html>
    `;
    const win = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
    win.document.open();
    win.document.write(popupHtml);
    win.document.close();
}


// ---- NEW Edit Modal Logic ----

function openEditModal(index) {
    const notes = getNotes();
    const note = notes[index];
    if (!note) return;

    editingIndex = index;

    // Populate the Quill editors with the note content
    editTitleEditor.root.innerHTML = note.title;
    editTextEditor.root.innerHTML = note.text;
    
    // Handle the image
    currentImageDataUrl = note.image || '';
    if (note.image) {
        editPreviewImage.src = note.image;
        editPreviewImage.style.display = 'block';
    } else {
        editPreviewImage.style.display = 'none';
    }

    editPopup.style.display = 'flex'; // Show the modal
    setTimeout(updatePickerLabels, 100); // Update picker labels in the modal
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
        title: DOMPurify.sanitize(updatedTitle),
        text: DOMPurify.sanitize(updatedText),
        image: currentImageDataUrl, // This will be the new or existing image URL
    };

    saveNotes(notes);
    showNotes();
    closeEditModal();
}


// ---- Event Listeners ----

// Listener for adding a new note
addNoteButton.addEventListener('click', addNotes);

// Listeners for the edit modal buttons
saveEditBtn.addEventListener('click', saveEditedNote);
cancelEditBtn.addEventListener('click', closeEditModal);


// Listener for image input when adding a note
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

// Listener for image input when editing a note
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
