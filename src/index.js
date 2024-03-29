//import debounce from "lodash/debounce";
import { createTeamRequest, loadTeamsRequest, updateTeamRequest, deleteTeamsRequest } from "./request";
import { $, sleep, debounce } from "./utilities";

let allTeams = [];
let editId;

function readTeam() {
  return {
    promotion: document.getElementById("promotion").value,
    members: document.getElementById("members").value,
    name: document.getElementById("name").value,
    url: document.getElementById("url").value
  };
}

function writeTeam({ promotion, members, name, url }) {
  document.getElementById("promotion").value = promotion;
  document.getElementById("members").value = members;
  document.getElementById("name").value = name;
  document.getElementById("url").value = url;
}

function getTeamsHTML(teams) {
  return teams
    .map(
      ({ promotion, members, name, url, id }) => `
    <tr>
        <td>${promotion}</td>
        <td>${members}</td>
        <td>${name}</td>
        <td>
        <a href="${url}" target ="_blank">${url.replace("https://github.com/", " ")}</a>
        </td>
        <td>
          <a data-id="${id}" class="remove-btn">✖</a>
          <a data-id="${id}" class="edit-btn">&#9998;</a>
        </td>
    </tr>`
    )
    .join("");
}

let oldDisplayTeams;
function displayTeams(teams) {
  if (oldDisplayTeams === teams) {
    console.warn("same teams to display");
    return;
  }
  oldDisplayTeams = teams;
  document.querySelector("#teams tbody").innerHTML = getTeamsHTML(teams);
}

function loadTeams() {
  return loadTeamsRequest().then(teams => {
    // window.teams = teams;
    console.info(teams);
    allTeams = teams;
    displayTeams(teams);
    return teams;
  });
}

async function onSubmit(e) {
  e.preventDefault();
  const team = readTeam();
  let status = { success: false };
  if (editId) {
    team.id = editId;
    const status = await updateTeamRequest(team);
    if (status.success) {
      allTeams = allTeams.map(t => {
        if (t.id === team.id) {
          return {
            ...t,
            ...team
          };
        }
        return t;
      });
    }
  } else {
    status = await createTeamRequest(team);
    if (status.success) {
      team.id = status.id;
      allTeams = [...allTeams, team];
    }
  }

  if (status.success) {
    displayTeams(allTeams);
    e.target.reset();
  }
}

function prepareEdit(id) {
  const team = allTeams.find(team => team.id === id);
  editId = id;

  document.getElementById("promotion").value = team.promotion;
  document.getElementById("members").value = team.members;
  document.getElementById("name").value = team.name;
  document.getElementById("url").value = team.url;
}

function searchTeams(search) {
  return allTeams.filter(team => {
    return team.promotion.indexOf(search) >= 0;
  });
}

function initEvents() {
  const form = document.getElementById("editForm");
  form.addEventListener("submit", onSubmit);
  form.addEventListener("reset", () => {
    editId = undefined;
  });

  $("#search").addEventListener(
    "input",
    debounce(function (e) {
      const teams = searchTeams(e.target.value);
      displayTeams(teams);
      console.info("search");
    }, 300)
  );
  $;

  document.querySelector("#teams tbody").addEventListener("click", async e => {
    if (e.target.matches("a.remove-btn")) {
      const id = e.target.dataset.id;
      const status = await deleteTeamsRequest(id);
      if (status.success) {
        loadTeams();
        //TODO dont load all teams
      }
    } else if (e.target.matches("a.edit-btn")) {
      const id = e.target.dataset.id;
      prepareEdit(id);
    }
  });
}

$("#editForm").classList.add("loading-mask");
loadTeams().then(async () => {
  await sleep(200);
  $("#editForm").classList.remove("loading-mask");
});
initEvents();

// console.info("sleep");
// sleep(2000).then(r => {
//   console.info("done1", r);
// });
// console.warn("after sleep");

// (async () => {
//   console.warn("sleep2");
//   var r2 = await sleep(5000);
//   console.warn("done2", r2);
// })();
