const fs = require('fs');
const wavDecoder = require('wav-decoder');
const wavEncoder = require('wav-encoder');

function floatToUnsignedInt16(floatNum) {
  return Math.max(0, Math.min(65535, Math.floor((floatNum + 1) * 32767.5)));
}

function unsignedInt16ToFloat(uint16) {
  return (uint16 / 32767.5) - 1;
}

async function readWavFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    return await wavDecoder.decode(buffer);
}

async function writeWavFile(filePath, audioData) {
    const buffer = await wavEncoder.encode(audioData);
    // Convert ArrayBuffer to Buffer
    const nodeBuffer = Buffer.from(buffer);
    fs.writeFileSync(filePath, nodeBuffer);
}

async function processWavFiles(fileA, fileB, outputFile) {
    const audioDataA = await readWavFile(fileA);
    const audioDataB = await readWavFile(fileB);

    if (audioDataA.numberOfChannels !== audioDataB.numberOfChannels ||
        audioDataA.sampleRate !== audioDataB.sampleRate) {
        throw new Error('WAV files must have the same format');
    }

    const length = Math.max(audioDataA.channelData[0].length, audioDataB.channelData[0].length);
    const differenceSamples = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const sampleA = audioDataA.channelData[0][i] || 0; // First channel of A
        const sampleB = audioDataB.channelData[0][i] || 0; // First channel of B
        // const intA = floatToUnsignedInt16(sampleA)
        // const intB = floatToUnsignedInt16(sampleB)
        
        // if same, then its the true sound
        // if completely different as much as could be, only one track has the sound
        // use that as a multiplier for how much to silence
        // const sampleC = Math.abs(sampleA - sampleB)
        let delta = Math.abs(sampleA - sampleB);
        const maxDelta = 0.05;
        const normalizedDelta = delta / maxDelta;
        differenceSamples[i] = (sampleA * (1 - normalizedDelta)) + (sampleB * normalizedDelta);
        console.log(sampleA, sampleB, differenceSamples[i])
        
        // differenceSamples[i] = unsignedInt16ToFloat(intD);
        // differenceSamples[i] = Math.abs(sampleA - sampleB);
        // differenceSamples[i] = sampleA - (differenceSamples[i] * 2);
        // console.log(sampleA, sampleB, sampleA - sampleB, '\t\t', intA, intB, differenceSamples[i])
    }

    const outputAudioData = {
        sampleRate: audioDataA.sampleRate,
        channelData: [differenceSamples]
    };

    await writeWavFile(outputFile, outputAudioData);
}

processWavFiles('a.wav', 'b.wav', 'output.wav').catch(console.error);
