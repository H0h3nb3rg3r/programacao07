document.addEventListener('DOMContentLoaded', function() {

  const workContainer = document.querySelector('#work-container');
  const workURL = `http://localhost:3000/work`;
  const workForm = document.querySelector('#work-form');
  let allwork = [];

  // Escapa texto para evitar quebra do HTML (aspas, < >) e injeção de código
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Trata resposta da API: lança erro se o status não for 2xx
  function checkResponse(response) {
    if (!response.ok) {
      throw new Error('Erro na API: ' + response.status);
    }
    return response;
  }

  function showError(err) {
    console.error(err);
    alert('Não foi possível concluir a operação. Verifique se o json-server está rodando em http://localhost:3000');
  }

  function renderProjectCard(work) {
    return `
      <div class="col-sm-6 col-lg-4 mb-4" id="work-${esc(work.id)}">
        <div class="card h-100 shadow-sm">
          <img src="${esc(work.coverImage)}" class="card-img-top" alt="Capa do Projeto" style="height: 160px; object-fit: cover;">
          <div class="card-body">
            <span class="badge badge-primary mb-2">${esc(work.class)}</span>
            <h5 class="card-title font-weight-bold text-dark">${esc(work.title)}</h5>
            <p class="card-text text-muted small">${esc(work.description)}</p>
          </div>
          <div class="card-footer bg-transparent border-top-0 d-flex justify-content-end pb-3">
            <button class="btn btn-sm btn-outline-secondary mr-2" data-id="${esc(work.id)}" id="edit-${esc(work.id)}" data-action="edit">Editar</button>
            <button class="btn btn-sm btn-outline-danger" data-id="${esc(work.id)}" id="delete-${esc(work.id)}" data-action="delete">Excluir</button>
          </div>
          <div id="edit-work-${esc(work.id)}" class="px-3 pb-3"></div>
        </div>
      </div>
    `;
  }

  // --- READ ---
  fetch(workURL)
    .then(checkResponse)
    .then(response => response.json())
    .then(workData => {
      allwork = workData;
      workContainer.innerHTML = "";
      workData.forEach(function(work) {
        workContainer.insertAdjacentHTML('beforeend', renderProjectCard(work));
      });
    })
    .catch(showError);

  // --- CREATE ---
  workForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const titleInput = workForm.querySelector('#title').value;
    const classInput = workForm.querySelector('#class').value;
    const coverImageInput = workForm.querySelector('#coverImage').value;
    const descInput = workForm.querySelector('#description').value;

    fetch(workURL, {
      method: 'POST',
      body: JSON.stringify({
        title: titleInput,
        class: classInput,
        coverImage: coverImageInput,
        description: descInput
      }),
      headers: { 'Content-Type': 'application/json' }
    })
    .then(checkResponse)
    .then(response => response.json())
    .then(work => {
      allwork.push(work);
      workContainer.insertAdjacentHTML('beforeend', renderProjectCard(work));
      workForm.reset();
    })
    .catch(showError);
  });

  // --- UPDATE & DELETE ---
  workContainer.addEventListener('click', (e) => {
    const action = e.target.dataset.action;
    const projectId = e.target.dataset.id;

    // Editar
    if (action === 'edit') {
      const editButton = document.querySelector(`#edit-${projectId}`);
      editButton.disabled = true;

      const workData = allwork.find(work => work.id == projectId);
      const editFormContainer = workContainer.querySelector(`#edit-work-${projectId}`);

      editFormContainer.innerHTML = `
        <form id="form-edit-${esc(projectId)}" class="border-top pt-3 mt-2">
          <div class="form-group mb-2">
            <input required class="form-control form-control-sm" id="edit-title" value="${esc(workData.title)}" placeholder="Título">
          </div>
          <div class="form-group mb-2">
            <input required class="form-control form-control-sm" id="edit-class" value="${esc(workData.class)}" placeholder="Disciplina">
          </div>
          <div class="form-group mb-2">
            <input required type="url" class="form-control form-control-sm" id="edit-coverImage" value="${esc(workData.coverImage)}" placeholder="URL da Imagem">
          </div>
          <div class="form-group mb-2">
            <textarea required class="form-control form-control-sm" id="edit-description" rows="2" placeholder="Descrição">${esc(workData.description)}</textarea>
          </div>
          <button type="submit" class="btn btn-sm btn-success btn-block">Salvar Alterações</button>
          <button type="button" class="btn btn-sm btn-secondary btn-block" data-action="cancel" data-id="${esc(projectId)}">Cancelar</button>
        </form>
      `;

      const currentEditForm = document.querySelector(`#form-edit-${projectId}`);
      currentEditForm.addEventListener("submit", (eventSubmit) => {
        eventSubmit.preventDefault();

        const titleInput = currentEditForm.querySelector("#edit-title").value;
        const classInput = currentEditForm.querySelector("#edit-class").value;
        const coverImageInput = currentEditForm.querySelector("#edit-coverImage").value;
        const descInput = currentEditForm.querySelector("#edit-description").value;

        const oldCardColumn = document.querySelector(`#work-${projectId}`);

        fetch(`${workURL}/${projectId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: titleInput,
            class: classInput,
            coverImage: coverImageInput,
            description: descInput
          }),
          headers: { 'Content-Type': 'application/json' }
        })
        .then(checkResponse)
        .then(response => response.json())
        .then(updatedwork => {
          const index = allwork.findIndex(w => w.id == projectId);
          allwork[index] = updatedwork;
          oldCardColumn.outerHTML = renderProjectCard(updatedwork);
        })
        .catch(showError);
      });

    // Cancelar edição
    } else if (action === 'cancel') {
      workContainer.querySelector(`#edit-work-${projectId}`).innerHTML = '';
      document.querySelector(`#edit-${projectId}`).disabled = false;

    // Excluir
    } else if (action === 'delete') {
      fetch(`${workURL}/${projectId}`, {
        method: 'DELETE'
      })
      .then(checkResponse)
      .then(() => {
        allwork = allwork.filter(w => w.id != projectId);
        document.querySelector(`#work-${projectId}`).remove();
      })
      .catch(showError);
    }
  });

});
