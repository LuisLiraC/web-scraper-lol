const puppeteer = require('puppeteer')
const fs = require('fs')
const fileName = 'names.json'

async function getChampions() {
  fs.exists(fileName, async (fileExists) => {
    if (fileExists) {
      fs.readFile(fileName, (error, data) => {
        if (error) {
          return console.log(err)
        }
        const champions = JSON.parse(data.toString())
        const begin = 0
        const end = (begin + 3) > data.length - 1 ? data.length - 1 : begin + 3
        for (let i = begin; i < end; i++) {
          getChampionData(champions[i], i)
        }
        // getChampionData('corki', 19) Corki is not on op.gg -- RIP :C
        // getChampionData('skarner', 107) Skarner is not on op.gg -- RIP :C
        // getChampionData('wukong', 135) Wukong is not on op.gg -- RIP :C
      })
    } else {
      const browser = await puppeteer.launch()
      const page = await browser.newPage()
      await page.goto('https://euw.leagueoflegends.com/en-gb/champions/',  { timeout: 0 })
      const data = await page.evaluate(() => {
        const champions = []
        document.querySelectorAll('.style__Text-sc-12h96bu-3').forEach(span => {
          let championName = span.textContent == 'Nunu & Willump' ? 'Nunu' : span.textContent
          championName = championName.replace(/['\s]/, '-')
          championName = championName.replace('.', '')
          champions.push(championName.toLowerCase())
        })
        return champions
      })

      fs.writeFile(fileName, JSON.stringify(data), 'utf8', (err) => {
        if (err) {
          return console.log(err.message)
        }
        browser.close()
        return console.log(`${fileName} Created`)
      })
    }
  })
}

const getChampionData = async (champion, index) => {
  if (champion == 'corki' || champion == 'skarner' || champion == 'wukong' || champion == undefined) {
    return
  }

  const browser = await puppeteer.launch()
  try {
    console.log(champion)
    const page = await browser.newPage()
    await page.goto(`https://euw.leagueoflegends.com/en-gb/champions/${champion}`, { timeout: 0 })

    console.log('Champion data', champion)
    const data = await page.evaluate(() => {
      function getAbilityNameBecauseRiotForgotIt(ch) {
        switch(ch) {
          case 'blitzcrank':
            return 'mana barrier'
        }
      }

      const alias = document.querySelector('.style__Intro-sc-14gxj1e-2').querySelector('span').textContent.trim().toLowerCase()
      const name = document.querySelector('.style__Title-sc-14gxj1e-3').querySelector('span').textContent.trim().toLowerCase()
      const role = document.querySelector('.style__SpecsItemValue-sc-1o884zt-15').textContent.trim().toLowerCase()
      const abilities = []
      document.querySelectorAll('.style__AbilityInfoItem-ulelzu-8').forEach(li => {
        abilities.push({
          type: li.querySelector('h6').textContent.trim(),
          name: li.querySelector('h5') == undefined ? getAbilityNameBecauseRiotForgotIt(name) : li.querySelector('h5').textContent.trim().toLowerCase(),
          description: li.querySelector('p').textContent.trim()
        })
      })
      const skins = []
      document.querySelectorAll('.style__SlideshowItem-sc-1tlyqoa-3').forEach(div => {
        skins.push(div.querySelector('img').getAttribute('src').trim())
      })

      return {
        alias,
        name,
        role,
        abilities,
        skins
      }
    })

    console.log('Region', champion)
    await page.goto(`https://universe.leagueoflegends.com/en_US/champion/${champion.replace('-', '')}/`, { timeout: 0 })
    data.region = await page.evaluate(() => {
      if(document.querySelector('.factionText_EnRL').querySelector('h6').textContent != '') {
        return document.querySelector('.factionText_EnRL').querySelector('h6').textContent.trim()
      } else {
        return document.querySelector('.factionText_EnRL').querySelector('h6').querySelector('span').textContent.trim()
      }
    })

    console.log('Imgs', champion)
    await page.goto(`https://euw.op.gg/champion/${champion.replace('-', '')}`,  { timeout: 0 })
    const imgs = await page.evaluate(() => {
      const champion_image = document.querySelector('.champion-stats-header-info__image').querySelector('img').getAttribute('src').trim()
      const abilitiesImgs = []
      document.querySelectorAll('.champion-stat__skill').forEach(a => {
        abilitiesImgs.push(a.querySelector('img').getAttribute('src').trim().replace(/^\/\/(.*\.png).*$/i, "$1"))
      })
      return {
        champion_image,
        abilitiesImgs
      }
    })

    data.champion_image = imgs.champion_image.replace(/^\/\/(.*\.png).*$/i, "$1")
    data.abilities.map((ability, index) => {
      ability.image = imgs.abilitiesImgs[index]
    })

    fs.writeFile(`./champions/${champion}.json`, JSON.stringify(data), 'utf8', (err) => {
      if (err) {
        browser.close()
        return console.log(err.message)
      }
      browser.close()
      return console.log(`JSON Created ${champion}`)
    })
  } catch (error) {
    browser.close()
    console.log(`Error: ${champion} - index: ${index} - [${error}]`)
  }
}

getChampions()