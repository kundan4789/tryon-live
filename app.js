import {
  FilesetResolver,
  PoseLandmarker
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/vision_bundle.mjs";


/*
=========================================================
TRYON LIVE
Concept & Experience by Kundan
Inspired by DailyObjects.com
=========================================================
*/


/*
---------------------------------------------------------
IMPORTANT
---------------------------------------------------------

After creating the Cloudflare Worker in Part 5,
paste your Worker URL below.

Example:

const API_BASE =
  "https://tryon-product-api.yourname.workers.dev";

---------------------------------------------------------
*/

const API_BASE = "https://tryon-product-api.kundan-singh-a50.workers.dev/";


const DEFAULT_PRODUCT =
  "https://www2.hm.com/en_in/productpage.1362738003.html";


/*
---------------------------------------------------------
DOM
---------------------------------------------------------
*/

const productUrlInput =
  document.getElementById("productUrl");

const loadProductBtn =
  document.getElementById("loadProductBtn");

const productImage =
  document.getElementById("productImage");

const imagePlaceholder =
  document.getElementById("imagePlaceholder");

const productTitle =
  document.getElementById("productTitle");

const productName =
  document.getElementById("productName");

const productPrice =
  document.getElementById("productPrice");

const productDescription =
  document.getElementById("productDescription");

const startTryOnBtn =
  document.getElementById("startTryOnBtn");

const tryonSection =
  document.getElementById("tryonSection");

const closeTryOnBtn =
  document.getElementById("closeTryOnBtn");

const cameraVideo =
  document.getElementById("cameraVideo");

const tryonCanvas =
  document.getElementById("tryonCanvas");

const cameraMessage =
  document.getElementById("cameraMessage");

const trackingStatus =
  document.getElementById("trackingStatus");

const systemStatus =
  document.getElementById("systemStatus");

const miniProductImage =
  document.getElementById("miniProductImage");

const miniProductName =
  document.getElementById("miniProductName");

const flipCameraBtn =
  document.getElementById("flipCameraBtn");


/*
---------------------------------------------------------
STATE
---------------------------------------------------------
*/

let currentProduct = null;

let currentProductImage = null;

let cameraStream = null;

let facingMode = "user";

let poseLandmarker = null;

let animationFrame = null;

let lastVideoTime = -1;

let cameraRunning = false;

let smoothX = 0;
let smoothY = 0;
let smoothWidth = 0;
let smoothHeight = 0;
let smoothRotation = 0;

let hasInitialPosition = false;


/*
---------------------------------------------------------
UTILITY
---------------------------------------------------------
*/

function setStatus(message) {

  systemStatus.textContent = message;

}


function showCameraMessage(message) {

  cameraMessage.querySelector("span").textContent =
    message;

  cameraMessage.style.display = "grid";

}


function hideCameraMessage() {

  cameraMessage.style.display = "none";

}


function clamp(value, min, max) {

  return Math.min(Math.max(value, min), max);

}


/*
---------------------------------------------------------
PRODUCT LOADING
---------------------------------------------------------
*/

async function loadProduct() {

  const url =
    productUrlInput.value.trim();

  if (!url) {

    alert("Please paste a product URL.");

    return;

  }


  if (
    !url.startsWith("http://") &&
    !url.startsWith("https://")
  ) {

    alert("Please enter a valid URL.");

    return;

  }


  if (
    API_BASE.includes("PASTE-YOUR")
  ) {

    alert(
      "First complete the Cloudflare Worker setup in Part 5, then paste your Worker URL into app.js."
    );

    return;

  }


  loadProductBtn.disabled = true;

  loadProductBtn.textContent =
    "Loading…";

  setStatus("Loading product");


  try {

    const endpoint =
      API_BASE.replace(/\/$/, "") +
      "/api/product?url=" +
      encodeURIComponent(url);


    const response =
      await fetch(endpoint);


    if (!response.ok) {

      throw new Error(
        "Product service returned " +
        response.status
      );

    }


    const product =
      await response.json();


    if (!product.image) {

      throw new Error(
        "No product image was found."
      );

    }


    currentProduct = product;


    productTitle.textContent =
      product.title ||
      "Product";


    productName.textContent =
      product.title ||
      "Product";


    productPrice.textContent =
      product.price ||
      "";


    productDescription.textContent =
      product.description ||
      "Product loaded successfully.";


    miniProductName.textContent =
      product.title ||
      "Product";


    /*
    -----------------------------------------------------
    Load image through Worker proxy.

    This avoids browser CORS problems when we draw
    the product into the camera canvas.
    -----------------------------------------------------
    */

    const proxiedImage =
      API_BASE.replace(/\/$/, "") +
      "/api/image?url=" +
      encodeURIComponent(product.image);


    await setProductImage(proxiedImage);


    currentProductImage =
      productImage;


    startTryOnBtn.disabled = false;


    setStatus("Product ready");

  }

  catch (error) {

    console.error(error);

    setStatus("Product failed");

    alert(
      "Unable to load this product.\n\n" +
      error.message +
      "\n\nCheck your Worker URL and try again."
    );

  }

  finally {

    loadProductBtn.disabled = false;

    loadProductBtn.textContent =
      "Load Product";

  }

}


/*
---------------------------------------------------------
IMAGE
---------------------------------------------------------
*/

function setProductImage(src) {

  return new Promise(
    (resolve, reject) => {

      productImage.onload =
        () => {

          productImage.style.display =
            "block";

          imagePlaceholder.style.display =
            "none";


          miniProductImage.src =
            src;


          resolve();

        };


      productImage.onerror =
        () => {

          reject(
            new Error(
              "Product image could not be loaded."
            )
          );

        };


      productImage.src =
        src;

    }
  );

}


/*
---------------------------------------------------------
CAMERA
---------------------------------------------------------
*/

async function startCamera() {

  if (cameraStream) {

    stopCamera();

  }


  showCameraMessage(
    "Requesting camera permission…"
  );


  try {

    cameraStream =
      await navigator.mediaDevices.getUserMedia({

        video: {

          facingMode,

          width: {
            ideal: 1280
          },

          height: {
            ideal: 720
          },

          frameRate: {
            ideal: 30
          }

        },

        audio: false

      });


    cameraVideo.srcObject =
      cameraStream;


    await cameraVideo.play();


    cameraRunning = true;


    resizeCanvas();


    hideCameraMessage();


    setStatus("Camera active");


    await initializePose();


    startTracking();

  }

  catch (error) {

    console.error(error);


    showCameraMessage(
      "Camera permission was denied or unavailable."
    );


    alert(
      "Camera could not be started.\n\n" +
      "Please allow camera access in your browser."
    );

  }

}


/*
---------------------------------------------------------
STOP CAMERA
---------------------------------------------------------
*/

function stopCamera() {

  cameraRunning = false;


  if (animationFrame) {

    cancelAnimationFrame(
      animationFrame
    );

    animationFrame = null;

  }


  if (cameraStream) {

    cameraStream
      .getTracks()
      .forEach(track => track.stop());

    cameraStream = null;

  }


  cameraVideo.srcObject =
    null;


  if (poseLandmarker) {

    try {

      poseLandmarker.close();

    }

    catch (error) {

      console.warn(error);

    }

    poseLandmarker = null;

  }


  trackingStatus.textContent =
    "Body tracking: stopped";

}


/*
---------------------------------------------------------
POSE INITIALIZATION
---------------------------------------------------------
*/

async function initializePose() {

  trackingStatus.textContent =
    "Body tracking: loading";


  const vision =
    await FilesetResolver.forVisionTasks(

      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"

    );


  poseLandmarker =
    await PoseLandmarker.createFromOptions(

      vision,

      {

        baseOptions: {

          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",

          delegate:
            "GPU"

        },

        runningMode:
          "VIDEO",

        numPoses:
          1,

        minPoseDetectionConfidence:
          0.5,

        minPosePresenceConfidence:
          0.5,

        minTrackingConfidence:
          0.5

      }

    );


  trackingStatus.textContent =
    "Body tracking: ready";

}


/*
---------------------------------------------------------
CANVAS
---------------------------------------------------------
*/

function resizeCanvas() {

  if (!cameraVideo.videoWidth) {

    return;

  }


  tryonCanvas.width =
    cameraVideo.videoWidth;

  tryonCanvas.height =
    cameraVideo.videoHeight;

}


/*
---------------------------------------------------------
TRACKING
---------------------------------------------------------
*/

function startTracking() {

  if (!cameraRunning) {

    return;

  }


  if (
    cameraVideo.readyState <
    2
  ) {

    animationFrame =
      requestAnimationFrame(
        startTracking
      );

    return;

  }


  if (
    cameraVideo.currentTime !==
    lastVideoTime
  ) {

    lastVideoTime =
      cameraVideo.currentTime;


    try {

      const results =
        poseLandmarker.detectForVideo(

          cameraVideo,

          performance.now()

        );


      drawFrame(results);

    }

    catch (error) {

      console.error(error);

    }

  }


  animationFrame =
    requestAnimationFrame(
      startTracking
    );

}


/*
---------------------------------------------------------
DRAW FRAME
---------------------------------------------------------
*/

function drawFrame(results) {

  const ctx =
    tryonCanvas.getContext("2d");


  ctx.clearRect(
    0,
    0,
    tryonCanvas.width,
    tryonCanvas.height
  );


  if (
    !results ||
    !results.landmarks ||
    !results.landmarks.length
  ) {

    trackingStatus.textContent =
      "Body tracking: looking…";

    return;

  }


  const landmarks =
    results.landmarks[0];


  /*
  MediaPipe landmarks:

  11 = left shoulder
  12 = right shoulder
  23 = left hip
  24 = right hip
  */


  const leftShoulder =
    landmarks[11];

  const rightShoulder =
    landmarks[12];

  const leftHip =
    landmarks[23];

  const rightHip =
    landmarks[24];


  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip
  ) {

    return;

  }


  /*
  Convert normalized coordinates
  into canvas coordinates.
  */

  const ls = {

    x:
      leftShoulder.x *
      tryonCanvas.width,

    y:
      leftShoulder.y *
      tryonCanvas.height

  };


  const rs = {

    x:
      rightShoulder.x *
      tryonCanvas.width,

    y:
      rightShoulder.y *
      tryonCanvas.height

  };


  const lh = {

    x:
      leftHip.x *
      tryonCanvas.width,

    y:
      leftHip.y *
      tryonCanvas.height

  };


  const rh = {

    x:
      rightHip.x *
      tryonCanvas.width,

    y:
      rightHip.y *
      tryonCanvas.height

  };


  /*
  Shoulder center
  */

  const centerX =
    (ls.x + rs.x) / 2;


  const shoulderY =
    (ls.y + rs.y) / 2;


  /*
  Shoulder width
  */

  const shoulderWidth =
    Math.sqrt(

      Math.pow(
        rs.x - ls.x,
        2
      )

      +

      Math.pow(
        rs.y - ls.y,
        2
      )

    );


  /*
  Torso height
  */

  const hipCenterY =
    (lh.y + rh.y) / 2;


  const torsoHeight =
    Math.abs(
      hipCenterY -
      shoulderY
    );


  /*
  Rotation of shoulders
  */

  const rotation =
    Math.atan2(
      rs.y - ls.y,
      rs.x - ls.x
    );


  /*
  -------------------------------------------------------
  GARMENT SIZE
  -------------------------------------------------------

  This is deliberately tuned for an overshirt.

  It expands beyond the shoulder line so sleeves
  don't look too narrow.
  */

  const targetWidth =
    shoulderWidth * 1.65;


  const targetHeight =
    Math.max(
      torsoHeight * 1.55,
      targetWidth * 1.15
    );


  /*
  Product center.

  Move it slightly below shoulder center.
  */

  const targetX =
    centerX;


  const targetY =
    shoulderY +
    torsoHeight * 0.52;


  /*
  Smooth movement.

  This prevents jitter.
  */

  const smoothing =
    0.22;


  if (!hasInitialPosition) {

    smoothX =
      targetX;

    smoothY =
      targetY;

    smoothWidth =
      targetWidth;

    smoothHeight =
      targetHeight;

    smoothRotation =
      rotation;

    hasInitialPosition =
      true;

  }

  else {

    smoothX +=
      (targetX - smoothX) *
      smoothing;

    smoothY +=
      (targetY - smoothY) *
      smoothing;

    smoothWidth +=
      (targetWidth - smoothWidth) *
      smoothing;

    smoothHeight +=
      (targetHeight - smoothHeight) *
      smoothing;


    /*
    Smooth rotation while avoiding
    sudden jumps around +/- PI.
    */

    let rotationDelta =
      rotation -
      smoothRotation;


    if (
      rotationDelta >
      Math.PI
    ) {

      rotationDelta -=
        Math.PI * 2;

    }


    if (
      rotationDelta <
      -Math.PI
    ) {

      rotationDelta +=
        Math.PI * 2;

    }


    smoothRotation +=
      rotationDelta *
      smoothing;

  }


  drawProductOverlay(

    ctx,

    smoothX,

    smoothY,

    smoothWidth,

    smoothHeight,

    smoothRotation

  );


  trackingStatus.textContent =
    "Body tracking: active";

}


/*
---------------------------------------------------------
DRAW PRODUCT
---------------------------------------------------------
*/

function drawProductOverlay(

  ctx,

  x,

  y,

  width,

  height,

  rotation

) {

  if (
    !currentProductImage ||
    !currentProductImage.complete
  ) {

    return;

  }


  ctx.save();


  ctx.translate(
    x,
    y
  );


  ctx.rotate(
    rotation
  );


  /*
  Slight vertical correction.
  */

  const yOffset =
    height * 0.04;


  ctx.globalAlpha =
    0.96;


  /*
  Shadow gives the overlay
  a slightly more natural presence.
  */

  ctx.shadowColor =
    "rgba(0,0,0,.30)";

  ctx.shadowBlur =
    18;


  ctx.drawImage(

    currentProductImage,

    -width / 2,

    -height / 2 + yOffset,

    width,

    height

  );


  ctx.restore();

}


/*
---------------------------------------------------------
TRY ON
---------------------------------------------------------
*/

async function openTryOn() {

  if (!currentProduct) {

    return;

  }


  tryonSection.classList.remove(
    "hidden"
  );


  tryonSection.scrollIntoView({

    behavior:
      "smooth",

    block:
      "start"

  });


  hasInitialPosition =
    false;


  await startCamera();

}


/*
---------------------------------------------------------
CLOSE TRY ON
---------------------------------------------------------
*/

function closeTryOn() {

  stopCamera();


  tryonSection.classList.add(
    "hidden"
  );


  setStatus("Ready");

}


/*
---------------------------------------------------------
FLIP CAMERA
---------------------------------------------------------
*/

async function flipCamera() {

  facingMode =
    facingMode === "user"
      ? "environment"
      : "user";


  if (cameraRunning) {

    await startCamera();

  }

}


/*
---------------------------------------------------------
EVENTS
---------------------------------------------------------
*/

loadProductBtn.addEventListener(
  "click",
  loadProduct
);


productUrlInput.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Enter"
    ) {

      loadProduct();

    }

  }
);


startTryOnBtn.addEventListener(
  "click",
  openTryOn
);


closeTryOnBtn.addEventListener(
  "click",
  closeTryOn
);


flipCameraBtn.addEventListener(
  "click",
  flipCamera
);


window.addEventListener(
  "resize",
  resizeCanvas
);


/*
---------------------------------------------------------
START
---------------------------------------------------------
*/

if (
  productUrlInput.value.trim() ===
  ""
) {

  productUrlInput.value =
    DEFAULT_PRODUCT;

}
