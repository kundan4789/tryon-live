/* =========================================================
   TRYON LIVE — CAMERA ENGINE
   Created by Kundan
   ========================================================= */

let cameraStream = null;


/* ---------------------------------------------------------
   CREATE CAMERA SCREEN
--------------------------------------------------------- */

function createCameraScreen() {

  if (document.getElementById("cameraScreen")) {
    return;
  }

  const screen = document.createElement("div");

  screen.id = "cameraScreen";

  screen.innerHTML = `
    <div class="camera-overlay">

      <div class="camera-container">

        <div class="camera-header">

          <div>
            <div class="camera-title">
              TRYON LIVE
            </div>

            <div class="camera-subtitle">
              Live Try-On
            </div>
          </div>

          <button
            class="camera-close"
            onclick="closeCamera()"
          >
            ×
          </button>

        </div>


        <div class="camera-stage">

          <video
            id="liveCamera"
            autoplay
            playsinline
            muted
          ></video>


          <div class="camera-live-badge">
            <span></span>
            LIVE
          </div>


          <!-- PRODUCT PLACEHOLDER -->

          <div
            id="productOverlay"
            class="product-overlay"
          >
            <div class="product-icon">
              🕶️
            </div>

            <div class="product-label">
              TRY-ON
            </div>
          </div>


          <div class="camera-message">

            <strong>
              You're live
            </strong>

            <span>
              Product try-on will appear here
            </span>

          </div>

        </div>


        <div class="camera-controls">

          <button
            class="camera-control"
            onclick="flipCamera()"
          >
            🔄
            <span>Flip</span>
          </button>


          <button
            class="camera-main-button"
            onclick="toggleCamera()"
          >
            <span id="cameraToggleIcon">
              ●
            </span>
          </button>


          <button
            class="camera-control"
            onclick="closeCamera()"
          >
            ✕
            <span>Close</span>
          </button>

        </div>


        <div class="camera-footer">

          <span>
            🔒 Camera stays in your browser
          </span>

          <span>
            Concept & Experience by Kundan
          </span>

        </div>

      </div>

    </div>
  `;

  document.body.appendChild(screen);

  addCameraStyles();

}


/* ---------------------------------------------------------
   START CAMERA
--------------------------------------------------------- */

async function startCamera() {

  createCameraScreen();

  const video =
    document.getElementById("liveCamera");

  try {

    cameraStream =
      await navigator.mediaDevices.getUserMedia({

        video: {
          facingMode: "user",
          width: {
            ideal: 1280
          },
          height: {
            ideal: 720
          }
        },

        audio: false

      });

    video.srcObject = cameraStream;

    showCameraMessage(
      "Camera connected"
    );

  } catch (error) {

    console.error(
      "Camera error:",
      error
    );

    showCameraMessage(
      "Camera permission is required"
    );

    alert(
      "Please allow camera access in your browser and try again."
    );

  }

}


/* ---------------------------------------------------------
   START TRY ON
--------------------------------------------------------- */

function startTryOn() {

  const input =
    document.getElementById("productUrl");

  const url =
    input.value.trim();


  if (!url) {

    showToast(
      "Please paste a product link first."
    );

    return;

  }


  try {

    new URL(url);

  } catch {

    showToast(
      "Please enter a valid product URL."
    );

    return;

  }


  localStorage.setItem(
    "tryon_product_url",
    url
  );


  startCamera();

}


/* ---------------------------------------------------------
   CLOSE CAMERA
--------------------------------------------------------- */

function closeCamera() {

  if (cameraStream) {

    cameraStream
      .getTracks()
      .forEach(
        track => track.stop()
      );

    cameraStream = null;

  }


  const screen =
    document.getElementById("cameraScreen");

  if (screen) {

    screen.remove();

  }

}


/* ---------------------------------------------------------
   TOGGLE CAMERA
--------------------------------------------------------- */

function toggleCamera() {

  if (!cameraStream) {

    startCamera();

    return;

  }


  const tracks =
    cameraStream.getVideoTracks();


  const isEnabled =
    tracks[0].enabled;


  tracks.forEach(
    track => {
      track.enabled = !isEnabled;
    }
  );


  const icon =
    document.getElementById(
      "cameraToggleIcon"
    );


  if (icon) {

    icon.textContent =
      isEnabled ? "○" : "●";

  }

}


/* ---------------------------------------------------------
   FLIP CAMERA
--------------------------------------------------------- */

async function flipCamera() {

  if (!cameraStream) {
    return;
  }


  const currentTrack =
    cameraStream.getVideoTracks()[0];


  const settings =
    currentTrack.getSettings();


  const currentFacing =
    settings.facingMode ||
    "user";


  const newFacing =
    currentFacing === "user"
      ? "environment"
      : "user";


  cameraStream
    .getTracks()
    .forEach(
      track => track.stop()
    );


  try {

    cameraStream =
      await navigator.mediaDevices.getUserMedia({

        video: {
          facingMode: newFacing,
          width: {
            ideal: 1280
          },
          height: {
            ideal: 720
          }
        },

        audio: false

      });


    const video =
      document.getElementById(
        "liveCamera"
      );


    video.srcObject =
      cameraStream;


  } catch (error) {

    console.error(error);

  }

}


/* ---------------------------------------------------------
   MESSAGE
--------------------------------------------------------- */

function showCameraMessage(message) {

  const messageBox =
    document.querySelector(
      ".camera-message"
    );


  if (!messageBox) {
    return;
  }


  messageBox.innerHTML = `
    <strong>
      ${message}
    </strong>

    <span>
      Product try-on will appear here
    </span>
  `;

}


/* ---------------------------------------------------------
   TOAST
--------------------------------------------------------- */

function showToast(message) {

  let toast =
    document.getElementById("toast");


  if (!toast) {

    toast =
      document.createElement("div");

    toast.id =
      "toast";

    toast.className =
      "toast";

    document.body.appendChild(
      toast
    );

  }


  toast.textContent =
    message;

  toast.classList.add(
    "show"
  );


  setTimeout(() => {

    toast.classList.remove(
      "show"
    );

  }, 3000);

}


/* ---------------------------------------------------------
   ROOM PLACEHOLDER
--------------------------------------------------------- */

function createRoom() {

  const roomId =
    Math.random()
      .toString(36)
      .substring(2, 9)
      .toUpperCase();


  const roomUrl =
    window.location.origin +
    window.location.pathname +
    "?room=" +
    roomId;


  navigator.clipboard
    .writeText(roomUrl)
    .then(() => {

      showToast(
        "Room link copied!"
      );

    })
    .catch(() => {

      prompt(
        "Copy this room link:",
        roomUrl
      );

    });

}


function joinRoom() {

  const roomId =
    prompt(
      "Enter the room code:"
    );


  if (!roomId) {
    return;
  }


  const cleanRoom =
    roomId
      .trim()
      .toUpperCase();


  window.location.href =
    window.location.pathname +
    "?room=" +
    encodeURIComponent(
      cleanRoom
    );

}


/* ---------------------------------------------------------
   CAMERA STYLES
--------------------------------------------------------- */

function addCameraStyles() {

  if (
    document.getElementById(
      "cameraStyles"
    )
  ) {
    return;
  }


  const style =
    document.createElement(
      "style"
    );


  style.id =
    "cameraStyles";


  style.textContent = `

    #cameraScreen {

      position: fixed;

      inset: 0;

      z-index: 9999;

      background: #050505;

    }


    .camera-overlay {

      width: 100%;

      height: 100%;

      display: flex;

      justify-content: center;

      align-items: center;

      background:
        radial-gradient(
          circle at 50% 20%,
          #252525,
          #050505 65%
        );

    }


    .camera-container {

      width: 100%;

      height: 100%;

      max-width: 1200px;

      display: flex;

      flex-direction: column;

    }


    .camera-header {

      height: 80px;

      display: flex;

      align-items: center;

      justify-content: space-between;

      padding: 0 24px;

      color: white;

      flex-shrink: 0;

    }


    .camera-title {

      font-size: 15px;

      font-weight: 700;

      letter-spacing: 1px;

    }


    .camera-subtitle {

      font-size: 11px;

      color: #999;

      margin-top: 3px;

    }


    .camera-close {

      width: 42px;

      height: 42px;

      border-radius: 50%;

      border: 1px solid rgba(
        255,
        255,
        255,
        .15
      );

      background: rgba(
        255,
        255,
        255,
        .08
      );

      color: white;

      font-size: 27px;

      cursor: pointer;

    }


    .camera-stage {

      position: relative;

      flex: 1;

      overflow: hidden;

      background: #111;

      border-radius: 30px;

      margin: 0 15px;

    }


    #liveCamera {

      width: 100%;

      height: 100%;

      object-fit: cover;

      transform: scaleX(-1);

    }


    .camera-live-badge {

      position: absolute;

      top: 20px;

      left: 20px;

      background: rgba(
        0,
        0,
        0,
        .65
      );

      backdrop-filter: blur(10px);

      color: white;

      border-radius: 100px;

      padding: 9px 13px;

      font-size: 11px;

      font-weight: 700;

      display: flex;

      align-items: center;

      gap: 7px;

    }


    .camera-live-badge span {

      width: 7px;

      height: 7px;

      background: #ff3b30;

      border-radius: 50%;

      box-shadow:
        0 0 12px
        rgba(
          255,
          59,
          48,
          .8
        );

    }


    .product-overlay {

      position: absolute;

      left: 50%;

      top: 40%;

      transform:
        translate(
          -50%,
          -50%
        );

      width: 150px;

      height: 150px;

      border-radius: 35px;

      background: rgba(
        255,
        255,
        255,
        .88
      );

      backdrop-filter: blur(10px);

      display: flex;

      flex-direction: column;

      justify-content: center;

      align-items: center;

      box-shadow:
        0 20px 60px
        rgba(
          0,
          0,
          0,
          .25
        );

    }


    .product-icon {

      font-size: 58px;

    }


    .product-label {

      font-size: 9px;

      font-weight: 700;

      letter-spacing: 2px;

      margin-top: 4px;

    }


    .camera-message {

      position: absolute;

      bottom: 22px;

      left: 50%;

      transform:
        translateX(-50%);

      background: rgba(
        0,
        0,
        0,
        .65
      );

      backdrop-filter: blur(12px);

      color: white;

      border-radius: 100px;

      padding: 10px 17px;

      display: flex;

      align-items: center;

      gap: 10px;

      white-space: nowrap;

      font-size: 11px;

    }


    .camera-message span {

      color: #aaa;

    }


    .camera-controls {

      height: 100px;

      display: flex;

      justify-content: center;

      align-items: center;

      gap: 55px;

      flex-shrink: 0;

    }


    .camera-main-button {

      width: 64px;

      height: 64px;

      border-radius: 50%;

      border: 5px solid white;

      background: transparent;

      color: white;

      font-size: 25px;

    }


    .camera-control {

      border: none;

      background: transparent;

      color: white;

      display: flex;

      flex-direction: column;

      align-items: center;

      gap: 4px;

      font-size: 20px;

    }


    .camera-control span {

      font-size: 9px;

      color: #999;

    }


    .camera-footer {

      padding: 0 25px 15px;

      display: flex;

      justify-content: space-between;

      color: #777;

      font-size: 9px;

      flex-shrink: 0;

    }


    @media(max-width:600px) {

      .camera-stage {

        border-radius: 20px;

        margin: 0 8px;

      }


      .camera-header {

        padding: 0 16px;

      }


      .camera-controls {

        gap: 40px;

      }


      .camera-footer {

        padding-left: 15px;

        padding-right: 15px;

      }


      .camera-footer span:last-child {

        display: none;

      }

    }

  `;


  document.head.appendChild(
    style
  );

}
`;


  document.head.appendChild(style);

}


/* ---------------------------------------------------------
   PAGE READY
--------------------------------------------------------- */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log(
      "TRYON LIVE camera engine loaded."
    );

  }
);
