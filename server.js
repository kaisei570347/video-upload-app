const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const { exec } = require('child_process');
const mysql = require('mysql2');

const app = express();

// CORSを有効にする
app.use(cors());

// 静的ファイルの提供
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/thumbnails', express.static('thumbnails'));

// MySQL 接続設定
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'kaisei9627', // ここに実際のMySQLのパスワードを入力してください
    database: 'video_uploads'  // 使用するデータベース名を指定
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

// 動画ファイルの保存先とファイル名を設定
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
    const { title, description } = req.body;

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

        // 動画情報をデータベースに保存
        const sql = 'INSERT INTO videos (filename, filepath, title, description) VALUES (?, ?, ?, ?)';
        db.query(sql, [req.file.filename, req.file.path, title, description], (err, result) => {
            if (err) {
                console.error('Failed to save video details:', err);
                return res.status(500).send('Failed to save video details.');
            }
            res.status(200).send('File uploaded and thumbnail generated successfully.');
        });
    });
});

// 動画リストを取得するエンドポイント
app.get('/videos', (req, res) => {
    const sql = 'SELECT * FROM videos';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch videos' });
        }
        res.json(results);
    });
});

// 動画の詳細を取得するエンドポイント
app.get('/video/:id', (req, res) => {
    const videoId = req.params.id;
    const sql = 'SELECT * FROM videos WHERE id = ?';
    db.query(sql, [videoId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch video details' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Video not found' });
        }
        res.json(results[0]);
    });
});

// エラーハンドリング
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

// サーバーの開始
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
