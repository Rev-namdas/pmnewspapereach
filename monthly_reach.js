/**
 * required puppeteer for headless browsing & scrapping
 * 
 * @created_by Ahmed Sadman
 * @created_at 02-06-2022
 */
const puppeteer = require('puppeteer')

// site url for scrapping
const url = "https://websiteseochecker.com/website-traffic-checker/";

/**
 * gets the monthly reach of newspapers
 * 
 * @param {serial for printing purpose} sl 
 * @param {each media link for scrapping} each_media_link 
 * 
 * @returns {integer reach value for that single media link}
 */
const getMonthlyReach = async (sl, each_media_link) => {
	try {
		// launch headless browsing
		const browser = await puppeteer.launch()
		const page = await browser.newPage()
		console.log(sl + '. ' + each_media_link);
		console.log('accessing...');
		await page.goto(url, { waitUntil: "domcontentloaded" })
		
		await page.waitForNetworkIdle() // page wait for page to be ready

		console.log('executing...');
		await page.type('[name=ckwebsite]', each_media_link) // typing on search box on site

		
		await page.evaluate(() => {
			document.getElementById('bigbutton').click() // search button click
		})
		
		console.log('searching...');
		await page.waitForSelector('#tblresult') // wait for the result to be shown
		let data = await page.evaluate(() => {
			// getting the monthly reach tr node as html string
			// (deapt nodes are not accessible)
			const output = document.querySelector('#tblresult > tbody > tr:nth-child(2)').innerHTML
			
			return output
		})
		
		console.log(data);
		// checks if any range value found
		// ex: 60 - 700 visitors
		// trims the highest reach value
		if(data.includes('-')){
			data = data.trim().split('\n')[1].trim().split('-')[1].trim().split(' ')[0]
		} else {
			// trims the tr value from td
			data = data.trim().split('\n')[1].trim().split(' ')[0].split('>')[1]
		}

		// removes the numeric comma value for converting string to integer later
		if(data.includes(',')){
			data = data.split(',').join('')
		}

		// if the td table is empty, then data will be 0
		if(isNaN(data)){
			data = 0
		}

		console.log('output=', data);

		await browser.close()
		return parseInt(data) // returning the reach value into integer
		
	} catch (error) {
		console.log(error);
		return 'API Error!'
	}
}

/**
 * find the reach value endpoint
 * 
 * @param {media json urls} medias 
 * @returns {json array result}
 */


// JSON Format for api call
// {
// 	media_urls: [
// 		{
// 			media_name: 'Prothom Alo',
// 			media_link: 'http://prothomalo.com'
// 		}
// 	]
// }

async function fetchReach(medias){
	const starting_time = new Date()

	// output format
	const result_obj = {
		result: [],
		unsolved: [],
		total_media: 0,
		total_solved: 0,
		total_unsolved: 0,
		started_at: '',
		updated_at: ''
	}

	// calling the fucntion to execute the reach value
	for(let i = 0; i < medias.length; i++) {
		const reach = await getMonthlyReach(sl = i+1, each_media_link = medias[i].media_link)

		// if any td is blank the reach will be 0 and pushed as unsolved
		if(reach === 0){
			result_obj.unsolved.push({
				media_name: medias[i].media_name,
				media_link: medias[i].media_link,
				reach: reach
			})
		} else {
			// otherwise the reach will be pushed as result
			result_obj.result.push({
				media_name: medias[i].media_name,
				media_link: medias[i].media_link,
				reach: reach
			})
		}
	}

	// for updating unsolved array
	let new_result_array = result_obj.unsolved
	
	// second attempt to get unsolved reach
	if(result_obj.unsolved.length > 0){
		for(let i = 0; i < result_obj.unsolved.length; i++) {
			const reach = await getMonthlyReach(sl = i+1, each_media_link = result_obj.unsolved[i].media_link)
			
			// reach found then pushes into the result output
			if(reach !== 0){
				result_obj.result.push({
					media_name: result_obj.unsolved[i].media_name,
					media_link: result_obj.unsolved[i].media_link,
					reach: reach
				})

				// removing the found reach from unsolved array 
				new_result_array = new_result_array.filter((each) => each.media_name !== result_obj.unsolved[i].media_name)
			}
		}
	}
	// updating the unsolved array
	result_obj.unsolved = new_result_array

	result_obj.total_media = medias.length // total number of media links
	result_obj.total_solved = result_obj.result.length // total number of reaches from media links
	result_obj.total_unsolved = result_obj.unsolved.length // total number of unresolved media links
	
	// fetching date
	const end_time = new Date()
	result_obj.started_at = starting_time.toLocaleString() // started_at datetime string
	result_obj.updated_at = end_time.toLocaleString() // updated_at datetime string

	console.log(result_obj);
	return result_obj;
}

module.exports = fetchReach