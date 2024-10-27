// Disable automatic discovery of Dropzone
Dropzone.autoDiscover = false;

// Initialize Dropzone and event handlers
function init() {
    let dz = new Dropzone("#dropzone", {
        url: "http://127.0.0.1:5003/classify_image", // Set the correct URL for your Flask endpoint
        maxFiles: 1,
        addRemoveLinks: true,
        dictDefaultMessage: "Drop an image or click here to upload",
        autoProcessQueue: false
    });

    // Remove the first file if a second file is added
    dz.on("addedfile", function() {
        if (dz.files[1] != null) {
            dz.removeFile(dz.files[0]);
        }
    });

    // Handle the complete event after processing a file
    dz.on("complete", function(file) {
        console.log("File processed:", file);  // Log the processed file

        // Prepare to send the image data to the server
        $.post(dz.options.url, { image_data: file.dataURL }, function(data) {
            console.log("Response Data:", data);  // Log the response from the server

            if (!data || data.error) {
                $("#resultHolder").hide();
                $("#divClassTable").hide();
                $("#playerInfo").hide();
                $("#error").text(data ? data.error : "An unknown error occurred").show();
                return;
            }

            // Predefined list of players
            let players = {
                "lionel_messi": "Lionel Messi",
                "maria_sharapova": "Maria Sharapova",
                "roger_federer": "Roger Federer",
                "serena_williams": "Serena Williams",
                "virat_kohli": "Virat Kohli"
            };

            let match = null;
            let bestScore = -1;

            // Find the best match based on class probabilities
            for (let i = 0; i < data.length; ++i) {
                let maxScoreForThisClass = Math.max(...data[i].class_probability);
                if (maxScoreForThisClass > bestScore) {
                    match = data[i];
                    bestScore = maxScoreForThisClass;
                }
            }

            if (match) {
                console.log("Match found:", match.class);  // Log the matched class

                // Check if the matched class is in the predefined players list
                let playerName = players[match.class];
                if (playerName) {
                    $("#error").hide();
                    $("#resultHolder").show();
                    $("#divClassTable").show();
                    $("#resultHolder").html($(`[data-player="${match.class}"]`).html());

                    // Update probability scores
                    let classDictionary = match.class_dictionary;
                    for (let personName in classDictionary) {
                        let index = classDictionary[personName];
                        let probabilityScore = match.class_probability[index];
                        let elementName = "#score_" + personName;
                        $(elementName).html(probabilityScore);
                    }

                    // Fetch player information only if the player is in the predefined list
                    fetchPlayerInfo(playerName);
                } else {
                    console.error("Player not recognized in the predefined list:", match.class);
                    $("#playerInfo").hide();
                }
            } else {
                console.error("No match found in classification results.");
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Error:", textStatus, errorThrown); // More detailed error information
            $("#error").text("Failed to upload the image.").show();
        });
    });

    // Process the queue when the submit button is clicked
    $("#submitBtn").on('click', function(e) {
        console.log("Submitting file...");
        dz.processQueue();
    });
}

// Fetch player information from the API
function fetchPlayerInfo(playerName) {
    let apiUrl = `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(playerName)}`;

    $.get(apiUrl, function(data) {
        console.log("Player data fetched:", data);  // Log the fetched player data
        if (data.player && data.player.length > 0) {
            // Iterate through the players to find the exact match for the given name
            let foundPlayer = data.player.find(player => player.strPlayer.toLowerCase() === playerName.toLowerCase());

            if (foundPlayer) {
                // Display player information
                $("#playerName").text(foundPlayer.strPlayer);
                $("#playerSport").text(foundPlayer.strSport);
                $("#playerNationality").text(foundPlayer.strNationality);
                $("#playerBirthYear").text(foundPlayer.dateBorn ? foundPlayer.dateBorn.split('-')[0] : 'N/A');
                $("#playerDescription").text(foundPlayer.strDescriptionEN || 'No description available');

                $("#playerInfo").show();
            } else {
                console.error("No exact match found for player:", playerName);
                $("#playerInfo").hide();
            }
        } else {
            console.error("No player data returned for:", playerName);
            $("#playerInfo").hide();
        }
    }).fail(function() {
        $("#playerInfo").hide();
        console.error("Failed to fetch player information.");
    });
}

// Document ready function to initialize the app
$(document).ready(function() {
    console.log("Document ready!");
    $("#error").hide();
    $("#resultHolder").hide();
    $("#divClassTable").hide();
    $("#playerInfo").hide();

    init();
});
