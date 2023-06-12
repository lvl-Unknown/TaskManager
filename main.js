// Initialize Firebase
const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL:
    "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: "",
};

firebase.initializeApp(firebaseConfig);
firebase.analytics();

// Reference to the table body
const tableBody = document.querySelector("tbody");

// Reference to the Firebase "Tasks" collection
const tasksRef = firebase.firestore().collection("Tasks");

// Reference to the Firebase "Users" collection
const usersRef = firebase.firestore().collection("Users");

// Current user
const current_user = localStorage.getItem("current_user");

// Show the current user logged in the Taskmanager page
document.getElementById("user-email").innerHTML = current_user;

/* The signUp() function creates a new user account with the provided email and password, logs the user object, 
   and adds a document to the "Users" collection in Firestore with the user's email and unique ID. 
   It also handles and logs any errors that may occur during the sign-up process.
 */
function signUp() {
  // Get Firestore reference
  var db = firebase.firestore();
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
      console.log(user);
      db.collection("Users")
        .add({
          email: email,
          userId: user.uid,
        })
        .then(function (docRef) {
          console.log("Document written with ID: ", docRef.id);
        })
        .catch(function (error) {
          console.error("Error adding document: ", error);
        });
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      console.log(errorCode);
      console.log(errorMessage);
    });
}

/* The signIn() function is responsible for handling the user sign-in process 
   in a web application that uses Firebase Authentication. When a user submits 
   their email and password through an HTML form, this function is called*
 */
function signIn() {
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      var user = userCredential.user;
      window.localStorage.setItem("current_user", user.email);
      window.location.href = "taskmanager.html"; // Redirect to task manager page
    })
    .catch((error) => {
      var errorCode = error.code;
      var errorMessage = error.message;
      if (errorCode === "auth/user-not-found") {
        alert("User does not exist!");
      } else {
        console.log(errorMessage);
      }
    });
}

/* The signOut() function is responsible for signing out the currently 
   authenticated user and redirects them to the sign-in page.
 */
function signOut() {
  firebase
    .auth()
    .signOut()
    .then(function () {
      // Sign-out successful.
      window.location.href = "signin.html"; // Redirect to the sign-in page
    })
    .catch(function (error) {
      // An error happened.
      console.log(error);
    });
}

/* The createTask() function creates a new task by adding a document to the "Tasks" collection in Firestore */
function createTask() {
  // Get Firestore reference
  var db = firebase.firestore();

  // Get form values
  var taskName = document.getElementById("taskName").value;
  var description = document.getElementById("createDescription").value;
  var status = document.getElementById("dropdownMenuButtonStatus").textContent;
  var assignedUserId = document.getElementById(
    "dropdownMenuButtonUsers"
  ).textContent;

  // Validate input
  if (!taskName || !description || !status || !assignedUserId) {
    console.log("Please fill in all fields.");
    alert("Please fill in all fields.");
    return;
  }

  // Add a new document with a generated ID to the "Tasks" collection
  db.collection("Tasks")
    .add({
      taskName: taskName,
      description: description,
      status: status,
      assignedUserId: assignedUserId,
      createdBy: current_user,
    })
    .then(function (docRef) {
      console.log("Document written with ID: ", docRef.id);
      // Clear form values
      document.getElementById("taskName").value = "";
      document.getElementById("createDescription").value = "";
      document.getElementById("dropdownMenuButtonStatus").textContent =
        "Not started";
      document.getElementById("dropdownMenuButtonUsers").textContent =
        "Assigned User ID";

      // alert("Task created successfully!");
    })
    .catch(function (error) {
      console.error("Error adding document: ", error);
    });
}

/* The deleteTableRow function enables the deletion of a table row 
   and the corresponding document in Firebase Firestore.
 */
function deleteTableRow() {
  const tableBody = document.querySelector("tbody");
  const rows = tableBody.querySelectorAll("tr");

  rows.forEach((row) => {
    const removeButton = row.querySelector(".fa-trash-alt");
    removeButton.addEventListener("click", () => {
      const docId = row.getAttribute("data-doc-id");
      const taskName = row.querySelector("#task-name").textContent;

      firebase
        .firestore()
        .collection("Tasks")
        .doc(docId)
        .delete()
        .then(() => {
          console.log("Document successfully deleted!");
          // Remove the row from the table
          row.remove();
        })
        .catch((error) => console.error("Error removing document: ", error));
    });
  });
}

// Add data to the table
function populateTable() {
  tasksRef.orderBy("status").onSnapshot((snapshot) => {
    tableBody.innerHTML = "";
    snapshot.forEach((doc) => {
      const task = doc.data();
      if (task.createdBy !== current_user) {
        return;
      }
      const row = `
        <tr class="fw-normal" data-doc-id="${doc.id}">
          <th>
            <span class="ms-2" id="task-name">${task.taskName}</span>
          </th>
          <td class="align-middle">
            <span id="description">${task.description}</span>
          </td>
          <td class="align-middle">
            <h6 class="mb-0">
              <span id="status" class="badge bg-${
                task.status === "Not started"
                  ? "danger"
                  : task.status === "In progress"
                  ? "warning"
                  : "success"
              }">${task.status}</span>
            </h6>
          </td>
          <td class="align-middle">
            <h6 class="mb-0">
              <span id"assignedUser" >${task.assignedUserId}</span>
            </h6>
          </td>
          <td class="align-middle">
          <a href="#!" data-mdb-toggle="modal" data-mdb-target="#editTaskModal" title="Edit" style="margin-left:5px; margin-right: 15px;" onclick="EditTaskModal()">
          <i class="fas fa-pen-to-square"></i>
          </a>        
            <a href="#!" data-mdb-toggle="tooltip" title="Remove"><i class="fas fa-trash-alt text-danger"></i></a>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });

    // Call deleteTableRow after populating the table to ensure the "data-doc-id" attribute is set correctly
    deleteTableRow();
  });
}

/* Dynamically replaces the status span elements with dropdown menus, 
   allowing users to select a new status for each task and update 
   he status in real-time both in the UI and in the Firestore database
 */
function createStatusDropdown() {
  const statusSpans = document.querySelectorAll("#statusCurrentUserTask");

  statusSpans.forEach((statusSpan) => {
    const currentStatus = statusSpan.textContent;
    const dropdownContainer = document.createElement("div");
    dropdownContainer.classList.add("dropdown");

    const dropdownToggle = document.createElement("button");
    dropdownToggle.classList.add("btn", "btn-secondary", "dropdown-toggle");
    dropdownToggle.setAttribute("type", "button");
    dropdownToggle.textContent = currentStatus;

    const dropdownMenu = document.createElement("ul");
    dropdownMenu.classList.add("dropdown-menu");

    // Define the available status options
    const statusOptions = [
      { value: "Not started", text: "Not started" },
      { value: "In progress", text: "In progress" },
      { value: "Completed", text: "Completed" },
    ];

    // Create a dropdown item for each status option
    statusOptions.forEach((option) => {
      const dropdownItem = document.createElement("li");
      const dropdownLink = document.createElement("a");
      dropdownLink.classList.add("dropdown-item");
      dropdownLink.setAttribute("href", "#");
      dropdownLink.textContent = option.text;

      // Update the status when a dropdown item is clicked
      dropdownLink.addEventListener("click", () => {
        const newStatus = option.value;
        statusSpan.textContent = newStatus;

        // Update the status in Firestore
        const docId = statusSpan.closest("tr").getAttribute("data-doc-id");
        const taskRef = tasksRef.doc(docId);
        taskRef
          .update({ status: newStatus })
          .then(() => {
            console.log("Status updated successfully");
          })
          .catch((error) => {
            console.error("Error updating status:", error);
          });
      });

      dropdownItem.appendChild(dropdownLink);
      dropdownMenu.appendChild(dropdownItem);
    });

    dropdownContainer.appendChild(dropdownToggle);
    dropdownContainer.appendChild(dropdownMenu);

    // Replace the status span with the dropdown container
    statusSpan.parentNode.replaceChild(dropdownContainer, statusSpan);
  });
}

function populateCurrentUserTable() {
  const tableBody = document.getElementById("userTasksTableBody");
  tasksRef.orderBy("status").onSnapshot((snapshot) => {
    tableBody.innerHTML = "";
    snapshot.forEach((doc) => {
      const task = doc.data();
      if (task.assignedUserId !== current_user) {
        return;
      }
      const row = `
        <tr class="fw-normal" data-doc-id="${doc.id}">
          <th>
            <span class="ms-2" id="task-name">${task.taskName}</span>
          </th>
          <td class="align-middle">
            <span id="description">${task.description}</span>
          </td>
          <td class="align-middle">
            <div class="dropdown" style="padding-right: 25px;">
              <button
                class="btn btn-${
                  task.status === "Not started"
                    ? "danger"
                    : task.status === "In progress"
                    ? "warning"
                    : "success"
                } btn-rounded dropdown-toggle"
                type="button"
                id="CurrentUserEditMenuButtonStatus"
                data-mdb-toggle="dropdown"
                aria-expanded="false"
              >
              ${task.status}
              </button>
              <ul class="dropdown-menu" aria-labelledby="CurrentUserEditMenuButtonStatus">
                <li><a class="dropdown-item" id="notStartedEditStatus">Not started</a></li>
                <li><a class="dropdown-item" id="inProgressEditStatus">In progress</a></li>
                <li><a class="dropdown-item" id="completedEditStatus">Completed</a></li>
              </ul>
            </div>
          </td>
          <td class="align-middle">
            <h6 class="mb-0">
              <span>${task.assignedUserId}</span>
            </h6>
          </td>
        </tr>
      `;
      tableBody.insertAdjacentHTML("beforeend", row);
    });

    // Call deleteTableRow after populating the table to ensure the "data-doc-id" attribute is set correctly
    deleteTableRow();

    // Update the status when a dropdown item is clicked
    updateEditStatus();
  });
}

function updateEditStatus() {
  // Get all the dropdown buttons
  const dropdownButtons = document.querySelectorAll(".dropdown-toggle");

  dropdownButtons.forEach((dropdownBtn) => {
    const dropdownMenu = dropdownBtn.nextElementSibling;
    const dropdownItems = dropdownMenu.querySelectorAll(".dropdown-item");

    dropdownItems.forEach((dropdownItem) => {
      dropdownItem.addEventListener("click", () => {
        const newStatus = dropdownItem.textContent;
        dropdownBtn.textContent = newStatus;

        // Update the status in Firestore
        const docId = dropdownBtn.closest("tr").getAttribute("data-doc-id");
        const taskRef = tasksRef.doc(docId);
        taskRef
          .update({ status: newStatus })
          .then(() => {
            console.log("Status updated successfully");
          })
          .catch((error) => {
            console.error("Error updating status:", error);
          });
      });
    });
  });
}

function EditTaskModal() {
  var modalTaskName = document.getElementById("taskNameEdit");
  var modalDescription = document.getElementById("descriptionEdit");
  var modalStatus = document.getElementById("dropdownEditMenuButtonStatus");
  var modalAssignedUser = document.getElementById(
    "dropdownMenuEditButtonUsers"
  );
  var modalEditBtn = document.getElementById("editModalBtn");

  const tableBody = document.querySelector("tbody");
  const rows = tableBody.querySelectorAll("tr");

  var selectedRow = null; // Store the selected row

  rows.forEach((row) => {
    const editButton = row.querySelector(".fa-pen-to-square");

    editButton.addEventListener("click", () => {
      // console.log(row);
      selectedRow = row; // Update the selected row
      const docId = row.getAttribute("data-doc-id");
      const docRef = firebase.firestore().collection("Tasks").doc(docId);
      docRef
        .get()
        .then((docSnapshot) => {
          if (docSnapshot.exists) {
            const data = docSnapshot.data();
            modalTaskName.value = data.taskName;
            modalDescription.value = data.description;
            modalStatus.textContent = data.status;
            modalAssignedUser.textContent = data.assignedUserId;
          } else {
            // Handle if the document doesn't exist
            console.log("Document does not exist");
          }
        })
        .catch((error) => {
          // Handle errors
          console.error("Error fetching document:", error);
        });
    });
  });

  modalEditBtn.addEventListener("click", async () => {
    if (selectedRow) {
      const docId = selectedRow.getAttribute("data-doc-id");
      try {
        const docRef = firebase.firestore().collection("Tasks").doc(docId);
        await docRef.update({
          taskName: modalTaskName.value,
          description: modalDescription.value,
          status: modalStatus.textContent,
          assignedUserId: modalAssignedUser.textContent,
        });
        console.log("Document updated successfully!");
      } catch (error) {
        // Handle errors
        console.error("Error updating document:", error);
      }
    } else {
      console.log("No row selected.");
    }
  });
}

function updateStatus() {
  // Get the dropdown button element
  const dropdownBtn = document.getElementById("dropdownMenuButtonStatus");

  // Get all the list items
  const notStartedStatus = document.getElementById("notStartedStatus");
  const inProgressStatus = document.getElementById("inProgressStatus");
  const completedStatus = document.getElementById("completedStatus");

  // Add a click event listener to each list item
  notStartedStatus.addEventListener("click", function () {
    dropdownBtn.textContent = "Not started";
  });

  inProgressStatus.addEventListener("click", function () {
    dropdownBtn.textContent = "In progress";
  });

  completedStatus.addEventListener("click", function () {
    dropdownBtn.textContent = "Completed";
  });
}

function populateUserDropdown() {
  const userList = document.getElementById("userListCreate");
  // Clear the existing list items
  userList.innerHTML = "";
  // Get the email for each user and create a new list item with the email
  usersRef.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (current_user != data.email) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.setAttribute("class", "dropdown-item");
        a.setAttribute("href", "#");
        a.textContent = data.email;
        a.onclick = () => {
          document.getElementById("dropdownMenuButtonUsers").textContent =
            data.email;
        };
        li.appendChild(a);
        userList.appendChild(li);
      }
    });
  });
}

function populateEditUserDropdown() {
  const editUserList = document.getElementById("editUserList");
  // Clear the existing list items
  editUserList.innerHTML = "";

  // Get the email for each user and create a new list item with the email
  usersRef.get().then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (current_user != data.email) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.setAttribute("class", "dropdown-item");
        a.setAttribute("href", "#");
        a.textContent = data.email;
        a.onclick = () => {
          document.getElementById("dropdownMenuButtonUsers").textContent =
            data.email;
        };
        li.appendChild(a);
        editUserList.appendChild(li);
      }
    });
  });
}

async function getTaskCounts() {
  const notStartedSnapshot = await firebase
    .firestore()
    .collection("Tasks")
    .where("status", "==", "Not started")
    .get();
  const inProgressSnapshot = await firebase
    .firestore()
    .collection("Tasks")
    .where("status", "==", "In progress")
    .get();
  const completedSnapshot = await firebase
    .firestore()
    .collection("Tasks")
    .where("status", "==", "Completed")
    .get();

  const counts = [
    notStartedSnapshot.size,
    inProgressSnapshot.size,
    completedSnapshot.size,
  ];

  return counts;
}

async function renderChart() {
  const chart = document.getElementById("pieChart").getContext("2d");
  const labels = ["Not started", "In progress", "Completed"];
  const colorHex = ["#dc3545", "#ffc107", "#198754"];

  const data = await getTaskCounts();
  // console.log(data);
  new Chart(chart, {
    type: "pie",
    data: {
      datasets: [{ data: data, backgroundColor: colorHex }],
      labels,
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Every Task Created Statuses",
        },
      },
    },
  });
}

// Populate the tasks that were created
populateTable(tasksRef);

// Call the populateUserDropdown function to populate the dropdown when the page loads
populateUserDropdown(usersRef);

// Populate the current user tasks that were created
populateCurrentUserTable(tasksRef);

//render the chart
renderChart();
