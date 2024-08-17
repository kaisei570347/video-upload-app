const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();

app.use(cors());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/thumbnails', express.static('thumbnails'));

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        const uniqueName = Date.now() + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

// 動画ファイルのアップロードを処理するエンドポイント
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    // サムネイルの生成 (1秒後のフレーム)
    const thumbnailPath = `thumbnails/${req.file.filename}.png`;
    const command = `ffmpeg -i ${req.file.path} -ss 00:00:01.000 -vframes 1 ${thumbnailPath}`;

    exec(command, (err) => {
        if (err) {
            console.error('Failed to generate thumbnail:', err);
            return res.status(500).send('Failed to generate thumbnail.');
        }

        res.status(200).send('File uploaded and thumbnail generated successfully.');
    });
});

app.get('/videos', (req, res) => {
    const directoryPath = path.join(__dirname, 'uploads');

    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to scan directory' });
        }

        const videoFiles = files.filter(file => file.endsWith('.mp4') || file.endsWith('.avi') || file.endsWith('.mkv'));
        const videosWithThumbnails = videoFiles.map(file => ({
            filename: file,
            thumbnail: `/thumbnails/${file}.png`
        }));
        
        res.json(videosWithThumbnails);
    });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
