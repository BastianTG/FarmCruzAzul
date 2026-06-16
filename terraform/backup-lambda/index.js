const { execSync } = require('child_process')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const path = require('path')

const s3 = new S3Client()

exports.handler = async () => {
  const { DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, S3_BUCKET } = process.env
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `backup-${DB_NAME}-${timestamp}.sql.gz`
  const filepath = `/tmp/${filename}`

  try {
    execSync(
      `mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} | gzip > ${filepath}`,
      { timeout: 240000 }
    )

    const fs = require('fs')
    const fileContent = fs.readFileSync(filepath)

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: `database/${filename}`,
      Body: fileContent,
      ServerSideEncryption: 'AES256',
    }))

    fs.unlinkSync(filepath)

    return { statusCode: 200, body: `Backup ${filename} subido exitosamente` }
  } catch (error) {
    console.error('Error en backup:', error)
    throw error
  }
}
