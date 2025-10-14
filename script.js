// DOM elements
const addNoteButton = document.getElementById('addNote');
const noteTitleInput = document.getElementById('note-title');
const noteContentInput = document.getElementById('note-content');
const notesDiv = document.getElementById('notes');
const notePopup = document.getElementById('notePopup');
const popupTitle = notePopup.querySelector('.modal-title');
const popupText = notePopup.querySelector('.modal-body');
const closeBtn = notePopup.querySelector('.close-modal');

// Load and show notes on page load
showNotes();

function addNotes() {
    let notes = getNotes();
    const noteTitle = noteTitleInput.value.trim();
    const noteContent = noteContentInput.value.trim();

    if (!noteTitle || !noteContent) {
        alert('Please enter both a title and content for the note.');
        return;
    }

    const noteObj = {
        title: DOMPurify.sanitize(noteTitle),
        text: DOMPurify.sanitize(noteContent)
    };

    notes.push(noteObj);
    saveNotes(notes);
    noteTitleInput.value = '';
    noteContentInput.value = '';
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
        const title = note.title || 'Note';
        noteElement.innerHTML = `
            <div class="note-header">${DOMPurify.sanitize(title)}</div>
            <div class="text">${DOMPurify.sanitize(note.text)}</div>
            <div class="note-actions">
                <button class="expand-btn" aria-label="Expand note">Expand</button>
                <button class="delete-btn" aria-label="Delete note">Delete</button>
            </div>
        `;

        noteElement.querySelector('.expand-btn').addEventListener('click', () => expandNote(index));
        noteElement.querySelector('.delete-btn').addEventListener('click', () => deleteNote(index));

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
    const notes = getNotes();
    if (!notes[index]) return;
    const note = notes[index];
    popupTitle.innerHTML = DOMPurify.sanitize(note.title || 'Note');
    popupText.innerHTML = DOMPurify.sanitize(note.text);
    notePopup.style.display = 'flex';
}

closeBtn.addEventListener('click', () => {
    notePopup.style.display = 'none';
});

notePopup.addEventListener('click', (e) => {
    if (e.target === notePopup) {
        notePopup.style.display = 'none';
    }
});

addNoteButton.addEventListener('click', addNotes);