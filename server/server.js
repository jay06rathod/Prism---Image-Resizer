require('dotenv').config({ path: '../.env' })

const express = require('express')
const app = express()

const cors = require('cors')
app.use(cors())

const upload = require('./middlewares/upload')
const s3 = require('./config/s3')
const { PutObjectCommand } = require('@aws-sdk/client-s3')
const sharp = require('sharp')

const mongoose = require('mongoose')

const port = process.env.PORT || 5000

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.log(`Mongo error: ${err}`))

// Test route
app.get('/', (req, res) => {
  res.send("Server running")
})

// Upload route
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const file = req.file

    // Get image metadata
    const metadata = await sharp(file.buffer).metadata()

    const baseName = Date.now()

    // Create variants (WebP + compression)
    const thumbnail = await sharp(file.buffer)
      .resize({
        width: metadata.width > 320 ? 320 : metadata.width
      })
      .webp({ quality: 70 })
      .toBuffer()

    const medium = await sharp(file.buffer)
      .resize({
        width: metadata.width > 768 ? 768 : metadata.width
      })
      .webp({ quality: 80 })
      .toBuffer()

    const large = await sharp(file.buffer)
      .resize({
        width: metadata.width > 1280 ? 1280 : metadata.width
      })
      .webp({ quality: 85 })
      .toBuffer()

    // Upload to S3
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `thumb-${baseName}.webp`,
      Body: thumbnail,
      ContentType: 'image/webp',
    }))

    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `medium-${baseName}.webp`,
      Body: medium,
      ContentType: 'image/webp',
    }))

    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: `large-${baseName}.webp`,
      Body: large,
      ContentType: 'image/webp',
    }))

    // Response
    res.json({
      message: 'Upload + optimization successful',
      files: {
        thumbnail: `thumb-${baseName}.webp`,
        medium: `medium-${baseName}.webp`,
        large: `large-${baseName}.webp`
      }
    })

  } catch (err) {
    console.log(err)
    res.status(500).json({ error: 'Upload Failed' })
  }
})

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})