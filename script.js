var chordLetters = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
var chordOptions = ["Major", "Minor", "Diminished", "Augmented", "Sus2", "Sus4"];
var chordExtensions = ["6th", "7th", "9th", "11th", "13th"];

var currentSynth = null;
var reverb = new Tone.Reverb({
    decay: 3,
    preDelay: 0.5
}).toDestination();

// Mapping chord types to their respective intervals
var chordTypes = {
  'Major': [4, 3],
  'Minor': [3, 4],
  'Diminished': [3, 3],
  'Augmented': [4, 4],
  'Sus2': [2, 5],
  'Sus4': [5, 2]
};

// Mapping extensions to their respective intervals
var extensionIntervals = {
  '6th': 9,
  '7th': 10,
  '9th': 14,
  '11th': 17,
  '13th': 21
};

var initialChordAmount = 4;
var previousAmount = initialChordAmount;
var selectedChord;

/* Variables that are referenced multiple times */
var chordContainerAmount;
var chordContainer;

/* Play button event listener */
document.getElementById('play-button').addEventListener('click', playProgression);

/* ## CHORD CREATION / DELETION ## */

function updateChordAmount(amount) {
  /* To avoid having to clear all chord boxes every time we update the amount of chords, we pop and create on the end. */
  
  /* Grab the amount we have changed */
  let deltaChange = amount - previousAmount;
  
  console.log("Amount is: "+amount+", previous amount is: "+previousAmount+", delta is "+deltaChange);
  
  if (deltaChange < 0) {
    removeChordBox(Math.abs(deltaChange));
  } else if (deltaChange > 0) {
    createChordBox(deltaChange);
  }
  
  /* Update it visually */
  document.getElementById('chord-count').textContent = amount;
  previousAmount = amount;
}

function createChordBox(amount) {
  /* Grab current amount of chords so we can update the indexes */
  chordContainer = document.getElementById('chord-container');

  chordContainerAmount = chordContainer.childElementCount;
  
  for (let i = 0; i < amount; i++) {
    const chordBox = document.createElement('div');
    
    /* Page Info */
    chordBox.className = 'chord-box';
    chordBox.draggable = true;
    chordBox.textContent = `Chord ${chordContainerAmount + i + 1}`;
    chordBox.dataset.defaultText = chordBox.textContent;
    chordBox.addEventListener('click', () => selectChord(chordBox));
    
    /* Info */
    chordBox.dataset.notes = 3;
    chordBox.dataset.chordTonic = '';
    chordBox.dataset.chordType = '';
    chordBox.dataset.chordExtensions = '';
    chordBox.dataset.chordInversion = '';

    chordContainer.appendChild(chordBox);
  }
}

function removeChordBox(amount) {
    chordContainer = document.getElementById('chord-container');

  /* Iterate through deltaAmount that we passed here and remove from the END of the array */
  for (let i = 0; i < amount; i++) {
    /* Remove child from end of DOM element */
    chordContainer.removeChild(chordContainer.lastChild);
  }
}

/* ## CHORDBOX FUNCTIONALITY ## */
function updateChordBox(chordBox, thingToUpdate, value) {
    console.log(chordBox + " : " + thingToUpdate + " : " + value);

    switch (thingToUpdate) {
        case 'chordType':
            chordBox.dataset.chordType = value;
            break;

        case 'extensions':
            let extensions = chordBox.dataset.chordExtensions ? chordBox.dataset.chordExtensions.split(',') : [];
            if (extensions.includes(value)) {
                extensions = extensions.filter(ext => ext !== value);
            } else {
                extensions.push(value);
            }
            chordBox.dataset.chordExtensions = extensions.join(',');
            chordBox.dataset.notes = extensions.length + 2;

            // Update the inversion slider range based on the number of extensions
            document.getElementById('inversion-slider').max = extensions.length + 2;
            break;

        case 'tonic':
            chordBox.dataset.chordTonic = value;
            break;

        case 'inversion':
            chordBox.dataset.chordInversion = value;
            document.getElementById('inversion-label').textContent = value;
            break;

        default:
            console.log('Unknown update type: ' + thingToUpdate);
    }

    // Call the function to update the chordBox text visually
    updateChordBoxText(chordBox);
}

function updateChordBoxText(chordBox) {
  // Check if the chordBox has the default text and clear it if it does
  if (chordBox.textContent === chordBox.dataset.defaultText) {
    chordBox.textContent = '';
  }
  
  // Build the text to display
  const chordType = chordBox.dataset.chordType || '';
  const chordExtensions = chordBox.dataset.chordExtensions ? `(${chordBox.dataset.chordExtensions})` : '';
  const chordTonic = chordBox.dataset.chordTonic || '';
  const inversion = chordBox.dataset.chordInversion ? `Inv: ${chordBox.dataset.chordInversion}` : '';

  // Update the text content of the chordBox
  chordBox.textContent = `${chordTonic} ${chordType} ${chordExtensions} ${inversion}`.trim();
}

function selectChord(chordBox) {
  // SHOW/HIDE CHORD BOX
  const chordPopup = document.getElementById('chord-popup');
  const isSameChord = selectedChord === chordBox;
  
  // SHOW/HIDE CHORD BOX FUNCTIONALITY
  if (isSameChord) {
    chordPopup.classList.toggle('initial-hide');
  } else {
    // Otherwise, set the selected chord and display the popup
    selectedChord = chordBox;
    chordPopup.classList.remove('initial-hide');

    // Calculate the position of the chordBox
    const rect = chordBox.getBoundingClientRect();
    const popupRect = chordPopup.getBoundingClientRect();

    // Set the popup position centered below the chordBox
    chordPopup.style.left = `${rect.left + (rect.width / 2) - (popupRect.width / 2)}px`;
    chordPopup.style.top = `${rect.bottom + window.scrollY + 10}px`; // 10px margin below
  }
  
  // PARSE CHORD BOX
  
  // Update chord type radio buttons
  const chordType = chordBox.dataset.chordType;
  document.querySelectorAll('input[name="chord-type"]').forEach((radio) => {
    radio.checked = radio.value === chordType;
  });

  // Update chord extensions checkboxes
  const extensions = chordBox.dataset.chordExtensions ? chordBox.dataset.chordExtensions.split(',') : [];
  document.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.checked = extensions.includes(checkbox.value);
  });

  // Update chord letter slider and text input
  const chordTonic = chordLetters.indexOf(chordBox.dataset.chordTonic || 'C');
  document.getElementById('letter-slider').value = chordTonic;
  document.getElementById('letter-input').value = chordBox.dataset.chordTonic || 'C';

  // Update chord inversion slider and label
  const inversion = chordBox.dataset.chordInversion || '0';
  document.getElementById('inversion-slider').value = inversion;
  document.getElementById('inversion-label').textContent = inversion;
}

// This will hide the chordbox if anything is clicked outside of it.
document.addEventListener('click', (event) => {
  const chordPopup = document.getElementById('chord-popup');
  if (!chordPopup.classList.contains('initial-hide') && !chordPopup.contains(event.target) && !selectedChord.contains(event.target)) {
    chordPopup.classList.add('initial-hide');
  }
});

// This will update the letter and the slider according to the input
document.getElementById('letter-slider').addEventListener('input', function() {
    const chordBox = selectedChord;
    const tonicLabel = document.getElementById('letter-input');
    tonicLabel.value = chordLetters[this.value];
    updateChordBox(chordBox, 'tonic', chordLetters[this.value]);
});

document.getElementById('letter-input').addEventListener('input', function() {
    const chordBox = selectedChord;
    const letterSlider = document.getElementById('letter-slider');
    const value = chordLetters.indexOf(this.value.toUpperCase());
    if (value !== -1) {
        letterSlider.value = value;
        updateChordBox(chordBox, 'tonic', this.value.toUpperCase());
    }
});


/* GENERATE FUNCTIONALITY */

// Update the tonic slider depending on its corresponding text input 
document.getElementById('tonic-slider').addEventListener('input', function() {
  const tonicLabel = document.getElementById('tonic-label');
  tonicLabel.value = chordLetters[this.value];
});

// Update the tonic label depending on the tonic slider.
document.getElementById('tonic-label').addEventListener('input', function() {
  const tonicSlider = document.getElementById('tonic-slider');
  const value = chordLetters.indexOf(this.value.toUpperCase());
  if (value !== -1) {
    tonicSlider.value = value;
  }
});

function generateProgression() {
  // Check if mood is selected
  const moodElement = document.querySelector('input[name="chord-mood"]:checked');
  if (!moodElement) {
    alert("Please select a mood.");
    return;
  }
  const mood = moodElement.value;

  // Check if tonic label is set
  const tonicLabel = document.getElementById('tonic-label').value;
  if (!tonicLabel || chordLetters.indexOf(tonicLabel.toUpperCase()) === -1) {
    alert("Please set a valid tonic.");
    return;
  }
  const tonicIndex = chordLetters.indexOf(tonicLabel.toUpperCase());

  // Check if complexity is selected
  const complexityElement = document.querySelector('input[name="chord-complexity"]:checked');
  if (!complexityElement) {
    alert("Please select a complexity.");
    return;
  }
  const complexity = complexityElement.value;

  // Grab the value of the number of chords
  const chordCount = parseInt(document.getElementById('chord-slider').value);

  // Determine the chord sequence
  let scale;
  switch (mood) {
    case "Happy":
    case "Melancholic":
      scale = [2, 2, 1, 2, 2, 2, 1];
      break;
    case "Sad":
      scale = [2, 1, 2, 2, 1, 2, 2];
      break;
    case "Ambient":
      scale = [2, 1, 2, 2, 1, 3, 1];
      break;
  }

  let scaleNotes = [tonicIndex];
  let currentIndex = tonicIndex;
  for (let i = 0; i < scale.length; i++) {
    currentIndex = (currentIndex + scale[i]) % chordLetters.length;
    scaleNotes.push(currentIndex);
  }

  let chordProgression = [0]; // Start with the first scale degree
  for (let i = 1; i < chordCount; i++) {
    if (Math.random() < 0.5) {
      chordProgression.push(Math.floor(Math.random() * 7));
    } else {
      chordProgression.push((chordProgression[i - 1] + 4) % 7);
    }
  }

  // Apply tonalities
  let chordWeights;
  switch (mood) {
    case "Happy":
      chordWeights = [0.8, 0.1, 0.05, 0.05, 0.2, 0.2];
      break;
    case "Sad":
      chordWeights = [0.1, 0.8, 0.05, 0.05, 0.2, 0.2];
      break;
    case "Melancholic":
      chordWeights = [0.3, 0.3, 0.1, 0.1, 0.1, 0.1];
      break;
    case "Ambient":
      chordWeights = [1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6, 1 / 6];
      break;
  }

  function getRandomChordType() {
    let rand = Math.random();
    let sum = 0;
    for (let i = 0; i < chordWeights.length; i++) {
      sum += chordWeights[i];
      if (rand < sum) {
        return chordOptions[i];
      }
    }
  }

  function getRandomExtensions() {
      chordContainer = document.getElementById('chord-container');

    return chordExtensions.filter(() => Math.random() < (complexity === "Simple" ? 0.05 : complexity === "Intermediate" ? 0.15 : complexity === "Complex" ? 0.3 : 0));
  }

  chordProgression.forEach((degree, index) => {
    const chordBox = chordContainer.children[index];
    
    // Clear the chord box before inputting
    chordBox.textContent = '';
    chordBox.dataset.chordTonic = '';
    chordBox.dataset.chordType = '';
    chordBox.dataset.chordExtensions = '';
    chordBox.dataset.chordInversion = '';
    chordBox.dataset.notes = 3;

    const chordType = getRandomChordType();
    const extensions = getRandomExtensions().join(',');

    updateChordBox(chordBox, 'tonic', chordLetters[scaleNotes[degree]]);
    updateChordBox(chordBox, 'chordType', chordType);
    updateChordBox(chordBox, 'extensions', extensions);
  });
}

/* Play functionality */

function validateChordBoxes() {
  const chordBoxes = document.querySelectorAll('.chord-box');
  for (const chordBox of chordBoxes) {
    if (!chordBox.dataset.chordTonic || !chordBox.dataset.chordType) {
      alert('All chord boxes must have a chord tonic and a chord type.');
      return false;
    }
  }
  return true;
}

function playProgression() {
    if (!validateChordBoxes()) return;

    // Dispose of the existing synth if it exists
    if (currentSynth) {
        currentSynth.dispose();
    }

    // Create a new PolySynth instance
    currentSynth = new Tone.PolySynth(Tone.Synth, {
        volume: -12, // Lower the volume for a softer sound
        envelope: {
            attack: 0.5,
            decay: 0.5,
            sustain: 0.7,
            release: 1
        }
    });

    // Connect the synth to the reverb
    currentSynth.connect(reverb);

    const now = Tone.now();
    let time = now;

    // Set the duration of each chord and the gap between chords
    const chordDuration = 1; 
    const gapBetweenChords = 0.1; 

    document.querySelectorAll('.chord-box').forEach(chordBox => {
        const tonic = chordBox.dataset.chordTonic;
        const type = chordBox.dataset.chordType;
        const chord = formulateChord(tonic, type, chordBox.dataset.chordExtensions.split(','), parseInt(chordBox.dataset.chordInversion, 10));

        // Trigger the chord with the specified duration
        currentSynth.triggerAttackRelease(chord, chordDuration, time, 0.5); 
        
        // Update the time for the next chord to start after the current chord ends plus the gap
        time += chordDuration + gapBetweenChords;
    });
}


function formulateChord(tonic, type, extensionsList, inversion) {
  const tonicIndex = chordLetters.indexOf(tonic);
  let octave = 4; 
  let chordNotes = [`${tonic}${octave}`];
  
  const intervals = chordTypes[type];
  let noteIndex = tonicIndex;
  
  // Calculate the main chord notes
  intervals.forEach(interval => {
    noteIndex += interval;
    if (noteIndex >= chordLetters.length) {
      noteIndex -= chordLetters.length;
      octave += 1;
    }
    chordNotes.push(`${chordLetters[noteIndex]}${octave}`);
  });

  // Calculate the extension notes
  extensionsList.forEach(ext => {
    if (extensionIntervals[ext]) {
      let extensionIndex = tonicIndex + extensionIntervals[ext];
      let extensionOctave = 3;
      if (extensionIndex >= chordLetters.length) {
        extensionIndex -= chordLetters.length;
        extensionOctave += 1;
      }
      extensionOctave += Math.floor(extensionIndex / chordLetters.length);
      extensionIndex = extensionIndex % chordLetters.length;
      chordNotes.push(`${chordLetters[extensionIndex]}${extensionOctave}`);
    }
  });

  // Handle inversions
  for (let i = 0; i < inversion; i++) {
    let note = chordNotes.shift();
    let [noteName, noteOctave] = [note.slice(0, -1), parseInt(note.slice(-1), 10) + 1];
    chordNotes.push(`${noteName}${noteOctave}`);
  }
  
  return chordNotes;
}


/* ADDITIONAL PAGE FUNCTIONALITY */

function toggleParameters() {
  const parametersContainer = document.getElementById('parameters-container');
  const arrow = document.getElementById('toggle-arrow');
  const isHidden = parametersContainer.classList.toggle('hidden');
  arrow.textContent = isHidden ? '▼' : '▲';
}


// Downloading
function downloadMidi() {
  
  if (!validateChordBoxes()) return;
  
  const midi = new Midi();
  const track = midi.addTrack();

  let time = 0;
  const chordDuration = 1; 

  document.querySelectorAll('.chord-box').forEach(chordBox => {
    const tonic = chordBox.dataset.chordTonic;
    const type = chordBox.dataset.chordType;
    const chord = formulateChord(tonic, type, chordBox.dataset.chordExtensions.split(','), parseInt(chordBox.dataset.chordInversion, 10));

    chord.forEach(note => {
      track.addNote({
        name: note,
        time: time,
        duration: chordDuration,
        velocity: 0.5 
      });
    });

    time += chordDuration + 0.1; 
  });

  const midiBlob = new Blob([midi.toArray()], { type: 'audio/midi' });

  const url = URL.createObjectURL(midiBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'chords.mid';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

document.addEventListener('DOMContentLoaded', function() {
    createChordBox(initialChordAmount);
});

