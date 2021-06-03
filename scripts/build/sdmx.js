module.exports = function(refresh=false) {

    const path = require('path')
    const utils = require('./utils')
    const store = require('../translation-store')

    const sdgMetadataConvert = require('sdg-metadata-convert')
    const sdmxOutput = new sdgMetadataConvert.SdmxOutput()

    if (refresh) {
        store.refresh()
    }
    const translations = store.getTranslationStore()

    function prepareOutput(text) {
        return text
            .replace(/'/g, '&#39;')
    }

    convertSdmx()

    function getSeriesFromIndicatorId(indicatorId) {
        indicatorId = indicatorId.replace(/-/g, '.')
        const series = sdgMetadataConvert.descriptorStore.getDescriptor('SERIES')
        const matches = series.options.filter(item => item.indicatorId === indicatorId)
        if (matches.length === 0) {
            return false
        }
        if (matches.length > 1) {
            console.log('WARNING: Multiple series matching indicator ' + indicatorId)
        }
        return matches[0].key
    }

    async function convertSdmx() {
        for (const language of Object.keys(translations)) {
            for (const indicatorId of Object.keys(translations[language])) {
                const concepts = translations[language][indicatorId]
                for (const concept in Object.keys(concepts)) {
                    if (concepts[concept]) {
                        concepts[concept] = prepareOutput(concepts[concept])
                    }
                }
                const series = getSeriesFromIndicatorId(indicatorId)
                if (!series) {
                    //console.log('Unable to produce SDMX for ' + indicatorId + '. SERIES could not be identified.')
                    continue
                }
                const descriptors = {
                    'LANGUAGE': language,
                    'REPORTING_TYPE': 'N',
                    'REF_AREA': 'BI',
                    'SERIES': series,
                }
                const metadata = new sdgMetadataConvert.Metadata(concepts, descriptors)
                const targetFolder = utils.createFolder(['www', 'sdmx', language])
                const targetFile = indicatorId + '.xml'
                const targetPath = path.join(targetFolder, targetFile)
                await sdmxOutput.write(metadata, targetPath)
                //console.log(`Created ${targetPath}.`);
            }
        }
    }
}
