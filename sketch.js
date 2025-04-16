let handPose;// Variable to store the hand pose detection model
let images = [];// Array to store loaded images
let currentIndex = 0;// Index to keep track of the current image being processed
let hands = [];// Array to store detected hand data
let csv;// Variable to store the CSV table for output data
let imageData = [];// Array to store filenames from the JSON file

// Array defining column names for the CSV file
let headers = ['mudra_name', 'hand',
  'wrist_x', 'wrist_y',
  'thumb_cmc_x', 'thumb_cmc_y',
  'thumb_mcp_x', 'thumb_mcp_y',
  'thumb_ip_x', 'thumb_ip_y',
  'thumb_tip_x', 'thumb_tip_y',
  'index_finger_mcp_x', 'index_finger_mcp_y',
  'index_finger_pip_x', 'index_finger_pip_y',
  'index_finger_dip_x', 'index_finger_dip_y',
  'index_finger_tip_x', 'index_finger_tip_y',
  'middle_finger_mcp_x', 'middle_finger_mcp_y',
  'middle_finger_pip_x', 'middle_finger_pip_y',
  'middle_finger_dip_x', 'middle_finger_dip_y',
  'middle_finger_tip_x', 'middle_finger_tip_y',
  'ring_finger_mcp_x', 'ring_finger_mcp_y',
  'ring_finger_pip_x', 'ring_finger_pip_y',
  'ring_finger_dip_x', 'ring_finger_dip_y',
  'ring_finger_tip_x', 'ring_finger_tip_y',
  'pinky_finger_mcp_x', 'pinky_finger_mcp_y',
  'pinky_finger_pip_x', 'pinky_finger_pip_y',
  'pinky_finger_dip_x', 'pinky_finger_dip_y',
  'pinky_finger_tip_x', 'pinky_finger_tip_y'
];


function preload() {
  imageData = loadJSON('fileList.json');// Load JSON file containing image filenames
  handPose = ml5.handPose(); // Load the hand pose detection model from ml5.js
}

function setup() {
  createCanvas(400, 400);
  csv = new p5.Table();// Initialize a p5.Table object for storing CSV data

  for (let h of headers) {
    csv.addColumn(h);
  }

  loadAllImages();
}

let imageFiles;// Array to store cleaned filenames from the JSON file
let imageLoadIndex = 0;// Index to track progress in loading images

function loadAllImages() {
  imageFiles = Array.isArray(imageData) ? imageData : Object.values(imageData);

  // Clean filenames by removing extra spaces and quotes
  imageFiles = imageFiles.map(f => f.trim().replace(/['"]/g, ''));
  loadNextImage();
}

function loadNextImage() {
  if (imageLoadIndex >= imageFiles.length) {
    processNextImage(); // start processing once all images are loaded
    return;
  }

  let imgFile = imageFiles[imageLoadIndex];

  // Construct the full path for the image
  let imgPath = 'Mudras_Compiled/' + imgFile;

  console.log("Loading image:", imgPath);// Log the loading process

  loadImage(imgPath,
    (img) => {
      images.push({
        img: img,
        filename: imgFile // Store the loaded image and its filename in the array
      });
      imageLoadIndex++;
      loadNextImage();
    },
    (err) => {
      console.error('Error loading image:', imgPath, err);// Handle errors during loading
      imageLoadIndex++;
      loadNextImage(); // continue even if one fails
    }
  );
}


function processNextImage() {
  if (currentIndex < images.length) {
    let currentImage = images[currentIndex];
    try {
      image(currentImage.img, 0, 0);
      handPose.detect(currentImage.img, gotHands);// Detect hand poses in the current image using HandPose model
    } catch (err) {
      console.error('Error processing image:', currentImage.filename, err);
      currentIndex++;
      processNextImage();
    }
  } else {
    if (csv.getRowCount() > 0) {
      saveTable(csv, 'hand_data.csv');// Save collected data into a CSV file 
      console.log('CSV saved with', csv.getRowCount(), 'entries');
    }
    noLoop();// Stop further execution of draw loop once processing is complete
  }
}

function gotHands(results) {
  let currentImage = images[currentIndex];
  hands = results;

  if (hands && hands.length > 0) {
    let row = csv.addRow();

    row.set('mudra_name', getMudraName(currentImage.filename));// Set mudra name based on filename pattern

    row.set('hand', getHandOrientation(currentImage.filename));// Set hand orientation based on filename pattern

    let flattened = flattenHandData(hands[0]);
    for (let i = 0; i < flattened.length; i++) {
      if (i + 2 < headers.length) {
        row.set(headers[i + 2], flattened[i]);// Populate keypoint data into respective columns of CSV table
      }
    }
  }

  currentIndex++;
  processNextImage();
}

function flattenHandData(hand) {
  let data = [];
  if (hand && hand.keypoints) {
    for (let i = 0; i < hand.keypoints.length; i++) {
      // Round coordinates to 2 decimal places
      data.push(round(hand.keypoints[i].x * 100) / 100);// Round x-coordinate to two decimal places and add to array
      data.push(round(hand.keypoints[i].y * 100) / 100);// Round y-coordinate to two decimal places and add to array
    }
  }
  return data;
}

function getMudraName(filename) {
  if (!filename) return 'unknown';
  if (filename.includes('M1')) return 'arala';
  if (filename.includes('M2')) return 'kapita';
  if (filename.includes('M3')) return 'katari';
  if (filename.includes('M4')) return 'katakamukha';
  if (filename.includes('M5')) return 'mayura';
  return 'unknown';
}

function getHandOrientation(filename) {
  if (!filename) return 'unknown';
  if (filename.includes('L')) return 'left';
  if (filename.includes('R')) return 'right';
  return 'unknown';
}