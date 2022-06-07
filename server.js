require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fetchReach = require('./monthly_reach')

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(cors({
	origin: '*'
}))

const validateReqJSON = (req, res, next) => {
	const { media_urls } = req.body
	
	// checking for 'media_urls' key in api call
	if(media_urls){
		// checking for blank values
		const media_names = media_urls.filter(media => media.media_name === '')
		const media_links = media_urls.filter(media => media.media_link === '')

		// blank will give an error message
		if((media_names.length === 0) && (media_links.length === 0)){
			next()
		} else {
			return res.status(400).json({ message: "Invalid JSON! Check 'media_name' or 'media_link'!" })
		}
	} else {
		return res.status(400).json({ message: "Invalid JSON! No 'media_urls' key found!" })
	}
}

app.post('/api/v1/fetch-newspaper-reach', validateReqJSON, async (req, res) => {
	const { media_urls } = req.body

	const result = await fetchReach(media_urls)
	return res.json(result)
})

app.listen(process.env.PORT || 5050, () => {
	console.log('listening on port ' + process.env.PORT)
})