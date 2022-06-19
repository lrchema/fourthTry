import { app } from "./config.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.8.2/firebase-auth.js";
/*
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the
 * License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * FirebaseUI initialization to be used in a Single Page application context.
 */

/**
 * @return {!Object} The FirebaseUI config.
 */

function getUiConfig() {
  return {
    callbacks: {
      // Called when the user has been successfully signed in.
      signInSuccessWithAuthResult: function (authResult, redirectUrl) {
        if (authResult.user) {
          handleSignedInUser(authResult.user);
        }
        if (authResult.additionalUserInfo) {
          document.getElementById("is-new-user").textContent = authResult
            .additionalUserInfo.isNewUser
            ? "New User"
            : "Existing User";
        }
        // Do not redirect.
        return false;
      },
    },
    // Opens IDP Providers sign-in flow in a popup.
    signInFlow: "popup",
    signInOptions: [
      // TODO(developer): Remove the providers you don't need for your app.
      {
        provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        // Required to enable ID token credentials for this provider.
        clientId: CLIENT_ID,
      },
      {
        provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID,
        scopes: ["public_profile", "email", "user_likes", "user_friends"],
      },
      firebase.auth.TwitterAuthProvider.PROVIDER_ID,
      firebase.auth.GithubAuthProvider.PROVIDER_ID,
      {
        provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
        // Whether the display name should be displayed in Sign Up page.
        requireDisplayName: true,
        signInMethod: getEmailSignInMethod(),
        disableSignUp: {
          status: getDisableSignUpStatus(),
        },
      },
      {
        provider: firebase.auth.PhoneAuthProvider.PROVIDER_ID,
        recaptchaParameters: {
          size: getRecaptchaMode(),
        },
      },
      {
        provider: "microsoft.com",
        loginHintKey: "login_hint",
      },
      {
        provider: "apple.com",
      },
      firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
    ],
    // Terms of service url.
    tosUrl: "https://www.google.com",
    // Privacy policy url.
    privacyPolicyUrl: "https://www.google.com",
    credentialHelper:
      CLIENT_ID && CLIENT_ID != "YOUR_OAUTH_CLIENT_ID"
        ? firebaseui.auth.CredentialHelper.GOOGLE_YOLO
        : firebaseui.auth.CredentialHelper.NONE,
    adminRestrictedOperation: {
      status: getAdminRestrictedOperationStatus(),
    },
  };
}

// Initialize the FirebaseUI Widget using Firebase.
const auth = getAuth(app);
var ui = new firebaseui.auth.AuthUI(auth);
// Disable auto-sign in.
ui.disableAutoSignIn();
const db = getFirestore(app);

/**
 * @return {string} The URL of the FirebaseUI standalone widget.
 */
function getWidgetUrl() {
  return (
    "/widget#recaptcha=" +
    getRecaptchaMode() +
    "&emailSignInMethod=" +
    getEmailSignInMethod() +
    "&disableEmailSignUpStatus=" +
    getDisableSignUpStatus() +
    "&adminRestrictedOperationStatus=" +
    getAdminRestrictedOperationStatus()
  );
}

/**
 * Redirects to the FirebaseUI widget.
 */
var signInWithRedirect = function () {
  window.location.assign(getWidgetUrl());
};

/**
 * Open a popup with the FirebaseUI widget.
 */
var signInWithPopup = function () {
  window.open(getWidgetUrl(), "Sign In", "width=985,height=735");
};

/**
 * Displays the UI for a signed in user.
 * @param {!firebase.User} user
 */
var handleSignedInUser = async function (user) {
  console.log("try111: inside handleSignedInUser");

  document.getElementById("user-signed-in").style.display = "block";
  document.getElementById("user-signed-out").style.display = "none";
  document.getElementById("name").textContent = user.displayName;
  document.getElementById("email").textContent = user.email;
  document.getElementById("phone").textContent = user.phoneNumber;
  document.getElementById("send-colour").addEventListener("click", function () {
    // console.log("hello1");
    handleUserAnswer();
  });

  var docRef2 = doc(db, "userAnswers", user.uid);
  docSnap2 = await getDoc(docRef2);
  if (docSnap2.exists()) {
    document.getElementById("prevAns").textContent =
      user.displayName + "'s favourite colour:" + docSnap2.data()["answer"];
    console.log(user.displayName + "'s favourite colour:", docSnap2.data());
  } else {
    // doc.data() will be undefined in this case
    console.log("No favourite colour!");
  }

  if (user.photoURL) {
    var photoURL = user.photoURL;
    // Append size to the photo URL for Google hosted images to avoid requesting
    // the image with its original resolution (using more bandwidth than needed)
    // when it is going to be presented in smaller size.
    if (
      photoURL.indexOf("googleusercontent.com") != -1 ||
      photoURL.indexOf("ggpht.com") != -1
    ) {
      photoURL =
        photoURL + "?sz=" + document.getElementById("photo").clientHeight;
    }
    document.getElementById("photo").src = photoURL;
    document.getElementById("photo").style.display = "block";
  } else {
    document.getElementById("photo").style.display = "none";
  }
};

/**
 * Displays the UI for a signed out user.
 */
var handleSignedOutUser = function () {
  document.getElementById("user-signed-in").style.display = "none";
  document.getElementById("user-signed-out").style.display = "block";
  ui.start("#firebaseui-container", getUiConfig());
};

// Listen to change in auth state so it displays the correct UI for when
// the user is signed in or not.
onAuthStateChanged(auth, function (user) {
  document.getElementById("check-this").addEventListener("click", function () {
    var userDispName = user ? user.displayName : "Unknown User";
    console.log(userDispName + " clicked!");
    document.getElementById("is-new-user").textContent =
      userDispName + " Clicked";
  });

  document.getElementById("loading").style.display = "none";
  document.getElementById("loaded").style.display = "block";

  user ? handleSignedInUser(user) : handleSignedOutUser();
});

/**
 * Deletes the user's account.
 */
var deleteAccount = function () {
  auth.currentUser.delete().catch(function (error) {
    if (error.code == "auth/requires-recent-login") {
      // The user's credential is too old. She needs to sign in again.
      signOut(auth).then(function () {
        // The timeout allows the message to be displayed after the UI has
        // changed to the signed out state.
        setTimeout(function () {
          alert("Please sign in again to delete your account.");
        }, 1);
      });
    }
  });
};

var handleUserAnswer = function () {
  var ans = document.getElementById("colour").value
    ? document.getElementById("colour").value
    : "None";
  console.log("ans: ", ans);
  // Check This
  // const x = db.collection("userAnswers").doc("test").get();
  setDoc(doc(db, "userAnswers", auth.currentUser.uid), {
    answer: ans,
  })
    .then(() => {
      console.log("favourite colour stored!woooooooooooo");
    })
    .catch((error) => {
      console.error("Error writing document: i love bugs", error);
    });
};
/**
 * Handles when the user changes the reCAPTCHA, email signInMethod or email
 * disableSignUp config.
 */
function handleConfigChange() {
  var newRecaptchaValue = document.querySelector(
    'input[name="recaptcha"]:checked'
  ).value;
  var newEmailSignInMethodValue = document.querySelector(
    'input[name="emailSignInMethod"]:checked'
  ).value;
  var currentDisableSignUpStatus = document.getElementById(
    "email-disableSignUp-status"
  ).checked;
  var currentAdminRestrictedOperationStatus = document.getElementById(
    "admin-restricted-operation-status"
  ).checked;
  location.replace(
    location.pathname +
      "#recaptcha=" +
      newRecaptchaValue +
      "&emailSignInMethod=" +
      newEmailSignInMethodValue +
      "&disableEmailSignUpStatus=" +
      currentDisableSignUpStatus +
      "&adminRestrictedOperationStatus=" +
      currentAdminRestrictedOperationStatus
  );
  // Reset the inline widget so the config changes are reflected.
  ui.reset();
  ui.start("#firebaseui-container", getUiConfig());
}

/**
 * Initializes the app.
 */
var initApp = function () {
  console.log("try111: inside initApp");

  document
    .getElementById("sign-in-with-redirect")
    .addEventListener("click", signInWithRedirect);
  document
    .getElementById("sign-in-with-popup")
    .addEventListener("click", signInWithPopup);
  document.getElementById("sign-out").addEventListener("click", function () {
    firebase.auth().signOut();
  });
  document
    .getElementById("delete-account")
    .addEventListener("click", function () {
      deleteAccount();
    });

  document
    .getElementById("recaptcha-normal")
    .addEventListener("change", handleConfigChange);
  document
    .getElementById("recaptcha-invisible")
    .addEventListener("change", handleConfigChange);
  // Check the selected reCAPTCHA mode.
  document.querySelector(
    'input[name="recaptcha"][value="' + getRecaptchaMode() + '"]'
  ).checked = true;

  document
    .getElementById("email-signInMethod-password")
    .addEventListener("change", handleConfigChange);
  document
    .getElementById("email-signInMethod-emailLink")
    .addEventListener("change", handleConfigChange);
  // Check the selected email signInMethod mode.
  document.querySelector(
    'input[name="emailSignInMethod"][value="' + getEmailSignInMethod() + '"]'
  ).checked = true;
  document
    .getElementById("email-disableSignUp-status")
    .addEventListener("change", handleConfigChange);
  document.getElementById("email-disableSignUp-status").checked =
    getDisableSignUpStatus();
  document
    .getElementById("admin-restricted-operation-status")
    .addEventListener("change", handleConfigChange);
  document.getElementById("admin-restricted-operation-status").checked =
    getAdminRestrictedOperationStatus();
};

window.addEventListener("load", initApp);
