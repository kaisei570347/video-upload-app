document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const videoFile = document.getElementById('videoFile').files[0];
    if (!videoFile) {
        alert('Please select a video file.');
        return;
    }

    const formData = new FormData();
    formData.append('video', videoFile);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/upload', true);

    xhr.upload.onprogress = function(event) {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            document.getElementById('progressContainer').style.display = 'block';
            document.getElementById('uploadProgress').value = percentComplete;
        }
    };

    xhr.onload = function() {
        document.getElementById('progressContainer').style.display = 'none';
        console.log('Status:', xhr.status);
        console.log('Response:', xhr.responseText);

        if (xhr.status === 200) {
            document.getElementById('resultMessage').textContent = 'Upload successful!';
        } else {
            document.getElementById('resultMessage').textContent = 'Upload failed. Please try again.';
        }
    };

    xhr.onerror = function() {
        console.error('An error occurred during the upload.');
        document.getElementById('resultMessage').textContent = 'An error occurred during the upload.';
    };

    xhr.send(formData);
});
