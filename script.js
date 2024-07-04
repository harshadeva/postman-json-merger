document.getElementById('compareBtn').addEventListener('click', function () {
    const file1 = document.getElementById('file1').files[0];
    const file2 = document.getElementById('file2').files[0];

    if (file1 && file2) {
        const reader1 = new FileReader();
        const reader2 = new FileReader();

        reader1.onload = function (e) {
            const json1 = JSON.parse(e.target.result);
            reader2.onload = function (e) {
                const json2 = JSON.parse(e.target.result);
                const differences = computeDifferences(json1, json2);
                displayDifferences(differences, file1.name, file2.name);
                const mergedJson = mergeFiles(json1, json2);
                setupDownload(mergedJson);
            };
            reader2.readAsText(file2);
        };
        reader1.readAsText(file1);
    } else {
        alert("Please select both JSON files.");
    }
});

function computeDifferences(json1, json2) {
    const differences = {
        uniqueToJson1: [],
        uniqueToJson2: []
    };

    const json1Items = json1.item.map(item => ({ name: item.name, type: item.item ? 'folder' : 'request' }));
    const json2Items = json2.item.map(item => ({ name: item.name, type: item.item ? 'folder' : 'request' }));

    json1Items.forEach(item1 => {
        if (!json2Items.some(item2 => item2.name === item1.name && item2.type === item1.type)) {
            differences.uniqueToJson1.push(item1);
        }
    });

    json2Items.forEach(item2 => {
        if (!json1Items.some(item1 => item1.name === item2.name && item1.type === item2.type)) {
            differences.uniqueToJson2.push(item2);
        }
    });

    return differences;
}

function displayDifferences(differences, fileName1, fileName2) {
    const differencesDiv = document.getElementById('differences');
    differencesDiv.innerHTML = `
        <h2>Unique to ${fileName1}</h2>
        <ul>${differences.uniqueToJson1.map(item => `<li>${item.name} <span>[${item.type}]</span></li>`).join('')}</ul>
        <h2>Unique to ${fileName2}</h2>
        <ul>${differences.uniqueToJson2.map(item => `<li>${item.name} <span>[${item.type}]</span></li>`).join('')}</ul>
    `;
    
    // Show the download button after displaying the differences
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.style.display = 'inline-block';
}

function mergeFiles(json1, json2) {
    const mergedJson = JSON.parse(JSON.stringify(json1));

    json2.item.forEach(folder2 => {
        const matchingFolder = mergedJson.item.find(folder1 => folder1.name === folder2.name && folder1.item);

        if (matchingFolder) {
            folder2.item.forEach(request2 => {
                const matchingRequest = matchingFolder.item.find(request1 => request1.name === request2.name);
                if (matchingRequest) {
                    request2.name += '-copy';
                }
                matchingFolder.item.push(request2);
            });
        } else {
            mergedJson.item.push(folder2);
        }
    });

    return mergedJson;
}

function setupDownload(mergedJson) {
    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.style.display = 'inline-block'; // Ensure it's displayed
    downloadBtn.addEventListener('click', function () {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mergedJson, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "merged_postman_collection.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
}
