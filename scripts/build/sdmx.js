module.exports = function(refresh=false) {

    const path = require('path')
    const fs = require('fs')
    const utils = require('./utils')
    const store = require('../translation-store')

    const sdgMetadataConvert = require('sdg-metadata-convert')
    const sdmxOutput = new sdgMetadataConvert.SdmxOutput()
    const wordTemplateInput = new sdgMetadataConvert.WordTemplateInput({
        debug: false,
        cheerio: { decodeEntities: false },
    })

    if (refresh) {
        store.refresh()
    }
    const translations = store.getTranslationStore()

    const sourceFolder = 'indicators'
    const extensions = ['.docx', '.docm']
    const files = fs.readdirSync(sourceFolder).filter(file => {
        return extensions.includes(path.extname(file).toLowerCase());
    })
    const conversions = files.map(sourceFile => {
        const sourcePath = path.join(sourceFolder, sourceFile)
        const indicatorId = path.parse(sourceFile).name
        const targetFile = indicatorId + '.xml'
        return [sourcePath, targetFile, indicatorId]
    })

    function prepareOutput(text) {
        return text
            .replace(/'/g, '&#39;')
    }

    convertSdmx()

    async function convertSdmx() {
        for (const conversion of conversions) {
            const [sourcePath, targetFile, indicatorId] = conversion
            try {
                const metadata = await wordTemplateInput.read(sourcePath)
                const series = metadata.getDescriptor('SERIES')
                if (!series || series.length === 0) {
                    console.log('Unable to produce SDMX for ' + indicatorId + '. SERIES could not be identified.')
                    continue
                }
                for (const language of store.getLanguages()) {
                    metadata.setDescriptor('LANGUAGE', language)
                    for (const concept of Object.keys(metadata.getConcepts())) {
                        const value = translations[language][indicatorId][concept]
                        metadata.setConcept(concept, prepareOutput(value))
                    }
                    const targetFolder = utils.createFolder(['www', 'sdmx', language])
                    const targetPath = path.join(targetFolder, targetFile)
                    await sdmxOutput.write(metadata, targetPath)
                    console.log(`Created ${targetPath}.`);
                }
            } catch(e) {
                console.log(e)
            }
        }
    }
}
