$(document).ready(function() {
  var myChart;

  $.getJSON("data/data.geojson").then(function(data) {
    var ctx = document.getElementById("myChart").getContext("2d");
    var placesScores = new Map();

    for (i in data.features) {
      placesScores.set(
        data.features[i].properties.name,
        data.features[i].properties.score
      );
		}
		
		var sortedPlacesScores = new Map([...placesScores.entries()].sort((a, b) => b[1] - a[1]));

    myChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Array.from(sortedPlacesScores.keys()),
        datasets: [
          {
            label: "Score ",
            data: Array.from(sortedPlacesScores.values()),
            fillColor: "rgba(0, 0, 0, 0.2)",
            strokeColor: "rgba(0, 0, 0, 0.5)",
            hoverBackgroundColor: "rgba(0, 0, 0, 0.5)",
            borderWidth: 1
          }
        ]
      },
      options: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: "Titulo"
        },
        scales: {
          xAxes: [
            {
              gridLines: {
                display: false
              },
              barPercentage: 1.0,
              categoryPercentage: 1.0,
              ticks: {
                display: false
              }
            }
          ],
          yAxes: [
            {
              gridLines: {
                display: false
              },
              barPercentage: 0.9,
              ticks: {
                display: false
              }
            }
          ]
        }
      }
    });
  });

  $("#reset-data").on("click", function() {
    goTop();
    resetMap();
  });

  $(".button-top").on("click", function() {
    goTop();
  });

  $(".block-sdgs .sdg").on("click", function(e) {
    updateChart(this, myChart);
    // changeSDG(this);
  });
});

function goTop() {
  $("html").animate({ scrollTop: 0 }, "medium");
}
function resetMap() {
  map.flyTo({
    center: [-4.045691, 40.214799],
    zoom: 1,
    speed: 1.1,
    curve: 2.5,
    easing: function(t) {
      return t;
    }
  });

  $("#country").text("");
  $("#title").html("<h2>Objetivos y metas de desarrollo sostenible</h2>");
  $("#data").html(""); // reiniciamos los datos
}

function updateChart(element, chart) {
  var places = new Map();
  var scores = [];
  var colors = [];

  var sdg_number = $(element).attr("data-sdg"); // cogemos el dato sdg clickeado
  let sdg_code = "sdg" + sdg_number;

  var jsonData = $.getJSON("data/data.geojson", sdg_code, function(data) {
    var code = this.url.split("?")[1];
    var ctx = document.getElementById("myChart").getContext("2d");

    for (var i in data.features) {
      places.set(data.features[i].properties.name, [
        data.features[i].properties.ods[code].score,
        data.features[i].properties.ods[code].color
      ]);
    }

		var sorted_places = new Map([...places.entries()].sort((a, b) => b[1][0] - a[1][0]));
		
    $.map(Array.from(sorted_places.values()), function(obj) {
      scores.push(obj[0]);
      colors.push(obj[1]);
    });

    chart.data.datasets[0].data = scores;
    chart.data.datasets[0].backgroundColor = colors;

    chart.update({
      duration: 800,
      easing: "easeOutBounce"
    });
  });
}
