const fs = require('fs')

fs.readdir('./champions/', (err, files) => {
  if (err) return console.log(err)

  let allData = []

  files.map(file => {
    fs.readFile(`./champions/${file}`, 'utf8', (err, data) => {
      if (err) return console.log(err)

      allData.push(JSON.parse(data.toString()))

      fs.writeFile('./champions.json', JSON.stringify(allData), (err) => {
        if (err) return console.log(err)
        return console.log('Data merged')
      })
    })
  })
})