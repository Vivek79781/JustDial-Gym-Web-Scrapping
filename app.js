const puppeteer = require('puppeteer-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
const ObjectsToCSV = require('objects-to-csv');

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve, _) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
};

(async () => {
    puppeteer.use(stealthPlugin());
    const browser = await puppeteer.launch({ 
        headless: false,
        product: 'chrome' 
    })
    const page = await browser.newPage();

    let grabbedInfo = []
    let pageNumber = 1
    for(let pageNumber = 1;pageNumber <= 10;pageNumber++) {
        await page.goto(`https://www.justdial.com/Bangalore/Gyms/nct-11575244/page-${pageNumber}`)
        await page.setViewport({
            width: 1200,
            height: 800
        });
        const map = {};
        let styles = await page.evaluate(() => {
            let style = document.querySelectorAll('style')
            return style[1].innerHTML
        })
        for(let i = 0;i < 10;i++){
            styles = styles.substring(styles.indexOf('.icon-'))
            map[styles.substring(6,9)] = i;
            styles = styles.substring(2)
        }
        await autoScroll(page);

        const grabInfo = await page.evaluate((map) => {
            const Tag = document.querySelectorAll(".cntanr")
            let nameList = [] 
            Tag.forEach((tag) => {
                try{
                    let record = { 'name': '','address':'','phone':'','email':'','category':''}
                    const section = tag.querySelector('.jbbg')
                    const store = section.querySelector('.col-md-12.col-xs-12.colsp')
                    const infoSection = store.querySelector('.jcar')
                    const info = infoSection.querySelector('.col-sm-5.col-xs-8.store-details.sp-detail.paddingR0')
                    record.name = info.querySelector('.store-name').innerText;
                    const addressInfo = info.querySelector('.address-info.tme_adrssec')
                    const address = addressInfo.querySelector('.desk-add.jaddt')
                    const addressText = address.querySelector('.adWidth.cont_sw_addr')
                    record.address = addressText.innerText
                    const phone = info.querySelector('.contact-info span')
                    const phoneSpan = phone.querySelectorAll('span')
                    let phoneNumber = "";
                    phoneSpan.forEach(span => {
                        const spanClass = span.getAttribute('class').substring(14)
                        phoneNumber = phoneNumber + map[spanClass].toString();
                    })
                    record.phone = phoneNumber
                    record.category = info.querySelector('.address-info.adinfoex ').innerText
                    nameList.push(record)
                } catch {
                    console.log('Error Found Here')
                }
            })
            return nameList;
        }, map)
        grabbedInfo = [...grabbedInfo,...grabInfo]
    }
    const csv = new ObjectsToCSV(grabbedInfo);

    await csv.toDisk('./info.csv', {
        allColumns: true,
        append: true,
    });
    await browser.close()
})();

//li cntanr
//    section jbbg
//      div col-md-12 col-xs-12  colsp
//          section jcar
//              div  col-sm-5 col-xs-8 store-details sp-detail paddingR0
//                  h2 store-name
//                  all info here