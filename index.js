const dropArea = document.querySelector('.drop-area');
const dragText = dropArea.querySelector('h2');
const button = dropArea.querySelector('button');
const input = dropArea.querySelector('#input-file');
let files;

button.addEventListener('click', () => {
    input.click();
});

input.addEventListener('change', function () {
    files = input.files;
    dropArea.classList.add('active');
    showFiles(files);
    dropArea.classList.remove('active');
});

function showFiles(files) {
    if (files.length === undefined) {
        processFile(files);
    } else {
        for (let file of files) {
            processFile(file);
        }
    }
}

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('active');
    dragText.textContent = 'Suelta para subir los archivos';
})

dropArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropArea.classList.remove('active');
    dragText.textContent = 'Arrastra y suelta tus archivos aquí';
})

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    files = e.dataTransfer.files;
    showFiles(files);
    dropArea.classList.remove('active');
    dragText.textContent = 'Arrastra y suelta tus archivos aquí';
})

function showFiles(files) {
    if (files.length === undefined) {
        processFile(files);
    } else {
        for (let file of files) {
            processFile(file);
        }
    }
}


function processFile(file) {
    const docType = file.type;
    const validExtensions = ['image/jpg', 'image/jpeg', 'image/png']

    if (validExtensions.includes(docType)) {
        const fileReader = new FileReader();
        const id = `file-${Math.random().toString(32).substring(7)}`;

        fileReader.addEventListener('load', e => {
            const fileUrl = fileReader.result;
            const image = `
            <div id="${id}" class="file-container">
                <img src="${fileUrl}" alt="${file.name}" width='50'>
                <div class="status">
                    <span>${file.name}</span>
                    <span class="status-text">Loading...</span>
                </div>
            </div>
            `;

            const html = document.querySelector("#preview").innerHTML
            document.querySelector("#preview").innerHTML = image + html;
        });
        fileReader.readAsDataURL(file);
        uploadFile(file, id);

    } else {
        alert('El archivo no es valido');
    }
}

async function uploadFile(file, id) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch("http://localhost:3001/upload", {
            method: "POST",
            body: formData
        });

        const responseText = await response.text();
        console.log(responseText);

        const element = document.querySelector(`#${id} .status-text`);
        if (element) {
            element.innerHTML = `<span class="success">El archivo fue subido correctamente</span>`;
        }
    } catch (error) {
        document.querySelector(
            `#${id} .status-text`
        ).innerHTML = `<span class="failure">El archivo no se pudo subir</span>`;
    }
}