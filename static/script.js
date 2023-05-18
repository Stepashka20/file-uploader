const uploadArea = document.querySelector('#uploadArea')
const dropZoon = document.querySelector('#dropZoon');
const loadingText = document.querySelector('#loadingText');
const fileInput = document.querySelector('#fileInput');
const previewImage = document.querySelector('#previewImage');
const fileDetails = document.querySelector('#fileDetails');
const uploadedFile = document.querySelector('#uploadedFile');
const uploadedFileInfo = document.querySelector('#uploadedFileInfo');
const uploadedFileName = document.querySelector('.uploaded-file__name');
const uploadedFileIconText = document.querySelector('.uploaded-file__icon-text');
const uploadedFileCounter = document.querySelector('.uploaded-file__counter');
const copyBtn = document.querySelector('.uploaded-file__copy-btn');
dropZoon.addEventListener('dragover', function (event) {
  event.preventDefault();
  dropZoon.classList.add('drop-zoon--over');
});
dropZoon.addEventListener('dragleave', function (event) {
  dropZoon.classList.remove('drop-zoon--over');
});
dropZoon.addEventListener('drop', function (event) {
  event.preventDefault();
  dropZoon.classList.remove('drop-zoon--over');
  const file = event.dataTransfer.files[0];
  uploadFile(file);
});
dropZoon.addEventListener('click', function (event) {
  fileInput.click();
});
fileInput.addEventListener('change', function (event) {
  const file = event.target.files[0];
  uploadFile(file);
});

copyBtn.addEventListener('click', function (event) {
    const el = document.createElement('textarea');
    el.value = document.querySelector(".uploaded-file__url-text").innerHTML;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
});

function uploadFile(file) {
    const fileReader = new FileReader();
    const fileType = file.type;
    const fileSize = file.size;

    dropZoon.classList.add('drop-zoon--Uploaded');
    loadingText.style.display = "block";
    previewImage.style.display = 'none';
    uploadedFile.classList.remove('uploaded-file--open');

    fileReader.addEventListener('load', function () {
        uploadArea.classList.add('upload-area--open');
        loadingText.style.display = "none";
        previewImage.style.display = 'block';
        fileDetails.classList.add('file-details--open');
        uploadedFile.classList.add('uploaded-file--open');
        uploadedFileInfo.classList.add('uploaded-file__info--active');
        previewImage.setAttribute('src', "./document-icon.svg");
        document.querySelector('.file-size').style.display = "block";
        document.querySelector('.file-size').innerHTML = formatBytes(fileSize);
        uploadedFileName.innerHTML = file.name;

        upload(file);
    });
    fileReader.readAsDataURL(file);
};
function formatBytes(bytes, decimals = 0) {
    if (!+bytes) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
function upload(file) {
    console.log(file);
    const root = document.querySelector(":root");
    root.style.setProperty("--loading-progress", `0%`);
    document.querySelector(".uploaded-file__url").style.display = "none";
    document.querySelector(".error__text").style.display = "none";

    const config = {
        onUploadProgress: function(progressEvent) {
            var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            uploadedFileCounter.innerHTML = `${percentCompleted}%`;
            console.log(percentCompleted);
            root.style.setProperty("--loading-progress", `${percentCompleted}%`);
        }
    };

    const options = {
        headers: {
            "filename": encodeURIComponent(file.name)
        },
        onUploadProgress: config.onUploadProgress
    };

    let data = new FormData();
    data.append('sampleFile', file);
  
    axios.post('/upload', data, options)
        .then(res => {
            uploadedFileCounter.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" style="fill: green;"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm-1.999 14.413-3.713-3.705L7.7 11.292l2.299 2.295 5.294-5.294 1.414 1.414-6.706 6.706z"></path></svg>`;
            console.log(res);
            document.querySelector(".uploaded-file__url").style.display = "flex";
            document.querySelector(".uploaded-file__url-text").innerHTML = `${location.origin}/${res.data}`;
        })
        .catch(err => {
            console.log(err);
            document.querySelector(".error__text").innerHTML = `${err.response.data}`;
            document.querySelector(".error__text").style.display = "block";
        });
}