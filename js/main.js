/* Variables configuración */
var url_base = window.location.href.includes("localhost") || window.location.href.includes("127.0.0.1") ? "/opensdg/" : "/";
var version_app = "0.2.1";

/* Variables globales */
var my_chart;
var my_radar;
var aux_data = true;
var data_general_spain = [98.7,62.8,93.8,88.1,82.6,84.6,90.6,74.0,67.9,69.3,88.0,61.2,88.9,47.6,56.6,72.6,55.0];
var summary = 0.0;

for(i in data_general_spain){
  summary += data_general_spain[i];
}

/* Valores calculados */
var score_national = round( summary/17.0 );
var score_cities = 0;
var score_cities_average = 0;
var number_cities = 0;

var map_data = new Object();
var location_id = "";
var city_graph = "";
var ods_selected = "";

/* Colores */
var bg_score_80 = "#4681CB";
var bg_score_70 = "#6395d3";
var bg_score_60 = "#6798d3";
var bg_score_50 = "#6e9bd3";
var bg_score_40 = "#86aad6";
var bg_score_30 = "#a8c1e0";
var bg_none 		= "#595959";
var bg_none_50  = "#ACACAC"; //"#595959";

var default_color = "#5A5A5A";
var light 	= "#ECECEC";
var gray 		= "#7B7B7B";
var default_color_trans = "rgba(123,123,123,.66)";
var light_trans 	= "rgba(236,236,236,0.33)";
var gray_trans 		= "rgba(48,48,48,0.13)";
var primary_color = "#4681CB";
var primary_color_50 = "rgba(70,129,203,.5)";

var bg_red = 		"#DD3545";
var bg_orange = "#E9713A";
var bg_yellow = "#F2BC3C";
var bg_green = 	"#1D8635";

var bg_red_50 = 		"#EE9AA2"; //"#DD3545";
var bg_orange_50 = 	"#F4B89C"; //"#E9713A";
var bg_yellow_50 = 	"#F7DE9D";//"#F2BC3C";
var bg_green_50 = 	"#8EC29A"; //"#1D8635";
var url = "";

$(document).ready(function() {

	includeHTML();

	/* Inicializamos los tooltips */
	$('*[data-toggle="tooltip"]').tooltip();
	/* Inicializamos los collapse */
	$('.collapse').collapse();

	// Click en botones de reset
	$('#reset-data-map').on('click', function() {
		goTop();
		resetMap();
	});
	$('#reset-data-ods').on('click', function() {
    resetChart(my_chart);
    clearSearchCities();
		colorMapByScore();
		hiddenElement("#reset-data-ods");
    resetMap();
	});

	// Click en ir arriba
	$(".button-top").on('click', function() {
		goTop();
	});

	// Click en ODS
	$(".block-sdgs .sdg").on('click', function(e) {
		showElement("#reset-data-ods");
    changeSDG(this);
		updateChart(this, my_chart);
    paintIndicators(location_id);
    paintDataChartAverage();
  });
  
  // Click en gráfica
  $("#my-chart").click(function(e) {
  	showElement("#reset-data-ods");
  	if( my_chart.getElementsAtEvent(e)[0] != undefined ){
  		var name_city = my_chart.getElementsAtEvent(e)[0]._model.label;
  		var ranking_city = my_chart.getElementAtEvent(e)[0]._index;

	    for (i in map_data){
	      if(map_data[i].name == name_city){
	        var location_id = i;

	        updateCityGraph( name_city, ranking_city );
	      }
	    }

	    map.flyTo({
	       center: map_data[ location_id ].coordinates,
	       speed: 1.1,
	       curve: 0,
	       easing: function (t) { return t; }
	     });

	    $("#title-city").html(name_city + " | ");
	    $("#data").html(""); // reiniciamos los datos

	    updateChart(this, my_chart);
	    paintIndicators(location_id);
	    colorODS(location_id);
	    updateRadar(my_radar, location_id);
    	clearSearchCities();
	    
	    //my_chart.getElementsAtEvent(e)[0].$previousStyle.backgroundColor = primary_color;
			//my_chart.render();

  	}
  });

	$(window).bind('hashchange', function() {
		url = window.location.href
		if (url.includes("#")){
			var split = url.split("#");
			var url_start = split[0].slice(0,-1);
			$.each( $('#search-cities option'), function(key, element){
				if( decodeURI(split[1]).toLowerCase()==element.value.toLowerCase()){
					//window.location.href = "http://localhost/analiticaEnreda/opensdg/profile#"+decodeURI(split[1]);
					window.location.href = url_start +"#"+decodeURI(split[1]);
				}
			});
		}
	});

  /* Búsqueda realizada */
  $('#search-cities-selected').on('change', function() {
		city = $(this).val();
		searchCities(city);
  });

  /* Click en botón de limpiar búsqueda */
  $('#clear-seach-cities').on('click', function() {
  	clearSearchCities();
  	$("#search-cities-selected").focus();
  });

  /* Click en tabs indicadores */
  $('.wrapper-tabs button').on('click', function() {
  	$('.wrapper-tabs button.active').removeClass("active");
  	$(this).addClass("active");
  	var data_tab = $(this).attr("data-tab");
  	openTab( data_tab );
	});
});

/* Función para abrir un tab determinado */
function openTab( id_element ){
	hiddenElement( $('.block-tabs ul'));
	showElement( $("#" + id_element) );
}
/* Función para limpiar el campo de búsqueda de ciudades */
function clearSearchCities() {
	$("#search-cities-selected").val("");
}

/* Función para pintar los indicadores */
function paintIndicators( location_id ){
	if(location_id!="" || location_id!=undefined){
		this.location_id = location_id;
	}

	if( location_id!="" && ods_selected!="" ){
		if(ods_selected!="18"){
			paintIndicatorsODS( location_id, ods_selected );
		}else{
			hiddenElement( $("#section-indicators") );
			clearBackgroundSDG();
		}
	}
}

/* Función para pintar los indicadores de una ciudad y el ODS seleccionado */
function paintIndicatorsODS( location_id, ods_selected){
	showElement( $("#section-indicators") );
	$("#section-indicators #img-sdg").attr("src", url_base + "images/sdgs/es/sdg_" + ods_selected + ".png");

	var ods_score = map_data[location_id].ods["sdg"+ods_selected].score;
	if( ods_score==null){
		$("#section-indicators #score-sdg").text( "NA" );
	}else{
		$("#section-indicators #score-sdg").text( round( map_data[location_id].ods["sdg"+ods_selected].score ) );
	}

	$("#section-indicators #list-indicators").html("");
	colorODSindicator();

	$.each( map_data[location_id].ods["sdg"+ods_selected].indicators, function(key, value){
		var ods_score = value.score==null ? "NA" : round(value.score);
		code = '<li class="list-group-item d-flex justify-content-between align-items-center">'
					    + getNameIndicator(value.id) +
							'<span class="badge badge-pill ' + getColor(value.color, "class-css") + '">' + ods_score + '</span>' +
					  '</li>';
		$("#section-indicators #list-indicators").append( code );
	});
}

/* Función para redondear un valor a dos decimales */
function round( value ){
	return Math.round(value * 100) / 100
}

/* Función para obtener el color correspondiente según el valor y el tipo */
function getColor( value, type ){
	res = "";
	if( type=="class-css"){
		switch( value ){
			case "green": res = "bg-green"; break;
			case "yellow": res = "bg-yellow"; break;
			case "orange": res = "bg-orange"; break;
			case "red": res = "bg-red"; break;
			default: res = "bg-none";
		}
	}else if( type=="var-js"){
		switch( value ){
			case "green": res = bg_green; break;
			case "yellow": res = bg_yellow; break;
			case "orange": res = bg_orange; break;
			case "red": res = bg_red; break;
			default: res = bg_none;
		}
	}
	else if( type=="var-js-50"){
		switch( value ){
			case "green": res = bg_green_50; break;
			case "yellow": res = bg_yellow_50; break;
			case "orange": res = bg_orange_50; break;
			case "red": res = bg_red_50; break;
			default: res = bg_none_50;
		}
	}
	return res;
}
// Función para colorear todos los ODS según la ciudad seleccionada
function colorODS( location_id ) {
	clearBackgroundSDG();
	this.location_id = location_id;
	$(".block-sdgs .sdg").each(function(index, element){
		data_sdg = $( element ).attr("data-sdg");
		if( data_sdg!=18 ){
			switch( map_data[ location_id ].ods["sdg"+data_sdg].color ){
				case "orange": $( element ).addClass("bg-orange"); break;
				case "yellow": $( element ).addClass("bg-yellow"); break;
				case "red": $( element ).addClass("bg-red"); break;
				case "green": $( element ).addClass("bg-green"); break;
				default: $( element ).addClass("bg-none");
			}
		}

	});
}
function colorODSindicator(){
	element = $("#section-indicators .sdg");
	clearBackgroundSDG(element);

	switch( map_data[ location_id ].ods["sdg"+ods_selected].color ){
		case "orange": $( element ).addClass("bg-orange"); break;
		case "yellow": $( element ).addClass("bg-yellow"); break;
		case "red": $( element ).addClass("bg-red"); break;
		case "green": $( element ).addClass("bg-green"); break;
		default: $( element ).addClass("bg-none");
	}
}

function hiddenElement(element) {
  $(element).addClass("hidden");
}
function showElement(element) {
  $(element).removeClass("hidden");
}

function goTop() {
  $("html").animate({ scrollTop: 0 }, "medium");
}
function resetMap() {
	map.flyTo({
		center: [-4.045691, 40.214799],
		zoom: 4,
		speed: 1.1,
		curve: 2.5,
		easing: function (t) { return t; }
	});


	ods_selected = 0;
	city_graph = "";
	location_id = "";

	$("#country").text( "" );
	$("#title-city").text("");
	$("#title").text("Objetivos y metas de desarrollo sostenible");
	$("#data").html(""); // reiniciamos los datos
	$("#infochart-ranking").html("");
	paintDataChartAverage();
	updateLegend("global");

	hiddenElement( $("#infochart-ranking").parent() );
	hiddenElement( $("#infochart-score").parent() );

	desactiveSDG();
}

/* 	Función que obtiene la data al pintar el mapa 
|		
|		El resultado, se recoge en un objeto map_data
|
*/
function obtieneData() {
	getDataJSON( ).done(function ( data_JSON ) { 
		$.map( data_JSON, function(file) {
			arrayData = new Object();
			var name = file.name.replace(/_/g, " ");

			arrayData[ "name" ] = name ; // hacemos replace para quitar los guiones bajos "_"
			arrayData[ "location_id" ] = file.location_id ;
			arrayData[ "score" ] = file.score ;
			arrayData[ "ods" ] = file.ods ;
			arrayData[ "coordinates" ] = [ file.lon, file.lat ];
			
			map_data[ file.location_id ] = arrayData;

			score_cities += file.score;
			number_cities++;

			createSearch( name, file.location_id );
		});

		score_cities_average = round( score_cities / number_cities*1.0 );
		paintDataChart();
		createChart();

		/* Comprobamos URL */
		url = window.location.href
		if (url.includes("#")){
			var split = url.split("#");
			searchCities(decodeURI(split[1]));
		}
	});
}

function createSearch( name, location_id ) {
	code = '<option value="' + name + '" data-location="' + location_id + '"></option>';
	$("#search-cities").append( code );
}

/* 
|		Funciones para pintar información que aparece encima de la gráfica de barras 
*/

/* 	Función para pintar puntuación del estado, total de ciudades y media de ciudades
|		encima de la gráfica al cargar los datos.
|		Se utiliza en la función obtieneData()
*/
function paintDataChart(){
	$('#infochart-global').html( score_cities_average );
	$('#infochart-number-cities').html( "(de " + number_cities + ")" );
	$('#infochart-state').html( score_national );
}
/* 	Función que calcula la media de los valores que se pintan en ese instante en la
|		gráfica y la pinta encima de la misma, además, pinta la puntuación del estado.
*/
function paintDataChartAverage() {
	var sum = my_chart.data.datasets[0].data.reduce( function(a,b) { return a + b; });
	var avg = sum / my_chart.data.datasets[0].data.length;
	$('#infochart-global').html( round(avg) );

	$('#infochart-state').html( score_national );
}
function paintDataChartRanking( value ){
	$('#infochart-ranking').html( value + 1 );
	$('#infochart-ranking').parent().removeClass("hidden");
}
function paintDataChartScoreCity( value ){
	var ods_score = value==0 ? "NA" : value;
	$('#infochart-score').html( ods_score );
	$('#infochart-score').parent().removeClass("hidden");
}


/*	Función que se ejecuta al clicar sobre un ODS */
function changeSDG(element) {
	data_sdg = $(element).attr('data-sdg'); // cogemos el dato sdg clickeado
	ods_selected = data_sdg;

	changeTitle(ods_selected); // cambiar título ODS
	activeSDG(element); // activar ODS visualmente

	var_filter = "";
	if( ods_selected!="18"){
		var_filter = "sdg" + ods_selected  +  "_color";
		// mostrar leyenda ODS
		updateLegend("ods");

		// cambiar color municipios por color ODS
		map.setPaintProperty(
			'ods-cities-shapes',
			'circle-color',
				['match',
					['get', var_filter],
						"red", bg_red,
						"yellow", bg_yellow,
						"orange", bg_orange,
						"green", bg_green,
						bg_none
				]
		)
	}else{
		updateLegend("global");
		desactiveSDG();
		colorMapByScore();
		hiddenElement("#reset-data-ods");
	}
}

/* Función para actualizar la leyenda que se muestra sobre el mapa */
function updateLegend( legend_active ){
	var elmnt_to_active, elmnt_to_desactive;

	switch( legend_active ){
		case "ods": 
			elmnt_to_active = $('#legend-ods');
			elmnt_to_desactive = $('#legend-global');
			break;
		case "global":
			elmnt_to_active = $('#legend-global');
			elmnt_to_desactive = $('#legend-ods');
			break;

	}

	showElement( elmnt_to_active)
	hiddenElement( elmnt_to_desactive );
}

/* Función para cambiar el título según el ODS seleccionado */
function changeTitle( data_sdg ) {
	let titulo = "";
		switch( data_sdg ){
			case "01": titulo = "Fin de la pobreza"; break;
			case "02": titulo = "Hambre cero"; break;
			case "03": titulo = "Salud y bienestar"; break;
			case "04": titulo = "Educación de calidad"; break;
			case "05": titulo = "Igualdad de género"; break;
			case "06": titulo = "Agua limpia y saneamiento"; break;
			case "07": titulo = "Energía asequible y no contaminante"; break;
			case "08": titulo = "Trabajo decente y crecimiento económico"; break;
			case "09": titulo = "Industria, innovación e infraestructura"; break;
			case "10": titulo = "Reducción de las desigualdades"; break;
			case "11": titulo = "Ciudades y comunidades sostenibles"; break;
			case "12": titulo = "Producción y consumo responsables"; break;
			case "13": titulo = "Acción por el clima"; break;
			case "14": titulo = "Vida submarina"; break;
			case "15": titulo = "Vida de ecosistemas terrestres"; break;
			case "16": titulo = "Paz, justicia e instituciones sólidas"; break;
			case "17": titulo = "Alizanzas para lograr los objetivos"; break;
			default: titulo = "Objetivos y metas de desarrollo sostenible";
		}
		$("#title").text( titulo );
}

/* Función para activar el ODS seleccionado */
function activeSDG( element ){
	desactiveSDG();
	$(element).addClass("sdg_hover"); 
}
/* Función para desactivar el ODS que estaba seleccionado */
function desactiveSDG(){
	$(".block-sdgs .sdg.sdg_hover").removeClass("sdg_hover");
}
/* Función para quitar el color del ODS */
function clearBackgroundSDG( element ){
	if(element){
		$( element ).removeClass("bg-orange");
		$( element ).removeClass("bg-yellow");
		$( element ).removeClass("bg-red");
		$( element ).removeClass("bg-green");
		$( element ).removeClass("bg-none");
	}else{
		$(".block-sdgs .sdg.bg-orange").removeClass("bg-orange");
		$(".block-sdgs .sdg.bg-yellow").removeClass("bg-yellow");
		$(".block-sdgs .sdg.bg-red").removeClass("bg-red");
		$(".block-sdgs .sdg.bg-green").removeClass("bg-green");
		$(".block-sdgs .sdg.bg-none").removeClass("bg-none");
	}
}

/* Función para colorear los municipos por score ODS */
function colorMapByScore() {
		map.setPaintProperty(
		'ods-cities-shapes',
		'circle-color', [ // color de relleno según valores
			'interpolate',
				['linear'],
				['get', 'score'], // cast de string a number
					0, bg_none,
					30, bg_score_30,
					40, bg_score_40,
					50, bg_score_50,
					60, bg_score_60,
					70, bg_score_70,
					80, bg_score_80
		],
	);
}

/* Función para obtener los datos del JSON local */
function getDataJSON() {
  return $.getJSON(url_base + "data/data.json").then(function(data) {
    return data;
  });
}

/* 
|		NO SE UTILIZA
|		Función para obtener los datos del JSON local
*/
function getDataJSONURL() {
  $.getJSON(url_base +"data/espana-municipios.geojson").then(function(data) {
    return data;
  });
}

/* Función para obtener ciudad de la data al buscar */
function findItemsJSON(data_items, id_search) {
  let res = null;
  $.map(data_items, function(obj) {
    console.log(obj.location_id + " --- " + id_search);
    if (obj.location_id === id_search) {
      res = obj;
    }
  });
  return res;
}

/* Función para obtener indicadores por ODS */
function findItemsBySDG(data_items, id_search) {
  let res = new Array();
  $.map(data_items, function(obj) {
    res[obj.id.toString()] = obj.ods[id_search][0];
  });
  return res;
}

function updateChart(element, chart) {
  if( ods_selected!="") {
  	var places = new Map();
	  var scores = [];
	  var colors = [];

	  var sdg_number = ods_selected; // cogemos el dato sdg clickeado
	  let sdg_code = "sdg" + sdg_number;

	  var jsonData = $.getJSON(url_base + "data/data.geojson", sdg_code, function(data) {
	    var code = sdg_code;
	    var ctx = document.getElementById("my-chart").getContext("2d");

	    for (var i in map_data) {
	    	if(map_data[i].ods[code].score==null){
	    		places.set(map_data[i].name, [
		        0,
		        map_data[i].ods[code].color
		      ]);
	    	}else{
	    		places.set(map_data[i].name, [
		        Math.round(map_data[i].ods[code].score * 1000) / 1000,
		        map_data[i].ods[code].color
		      ]);
	    	}  
	    }


	    var sorted_places = new Map(
	      [...places.entries()].sort((a, b) => b[1][0] - a[1][0])
	    );

	    $.map(Array.from(sorted_places.values()), function(obj) {
	      scores.push(obj[0]);
	      colors.push( getColor(obj[1], "var-js-50"));
	    });

	    chart.data.labels = Array.from(sorted_places.keys());
	    chart.data.datasets[0].data = scores;
	    chart.data.datasets[0].backgroundColor = colors;

	    
	  }).then(function(){
	  	chart.update({
	      duration: 800,
	      easing: "linear"
			});
	  	highlightCityGraph();
	  });

	}else{
			highlightCityGraph();
			chart.update({
	      duration: 800,
	      easing: "linear"
			});

	}
}

function highlightCityGraph() {
	$( my_chart.getDatasetMeta(0).data ).each( function(index, element) {
		var is_city = element._model.label == city_graph; 

		if( ods_selected=="" || ods_selected=="18"){

			if( is_city ){
				element._model.backgroundColor = primary_color;
				paintDataChartRanking( element._index );
				paintDataChartScoreCity( round(my_chart.data.datasets[0].data[ element._index ]) );
				
			}else{
				element._model.backgroundColor = gray_trans;
			}

		}else{

			if( is_city ){
				element._model.backgroundColor = primary_color;
				paintDataChartRanking( element._index );
				paintDataChartScoreCity( round(my_chart.data.datasets[0].data[ element._index ]) );
			}/*else{

				if( element._model.backgroundColor == primary_color ){
					element._model.backgroundColor = element["$previousStyle"].backgroundColor;
				}
			}*/

		}

	my_chart.clear();
	my_chart.render();
	paintDataChartAverage();
	});
}

//Funcion busqueda ciudades
function searchCities(city) {
	var city_finded = false;
	$.each( $('#search-cities option'), function(key, element){
		if( city.toLowerCase()==element.value.toLowerCase()){
			location_id = $(element).attr("data-location");
			city_finded = true;
			city = element.value;
		}
	});
	if( city_finded ){
		map.flyTo({
			center: map_data[ location_id ].coordinates,
			speed: 1.1,
			curve: 0,
			easing: function (t) { return t; }
		});

		$("#title-city").html( city + " | ");
		$("#data").html(""); // reiniciamos los datos

		updateChart(this, my_chart);
		paintIndicators(location_id);
		colorODS( location_id );
		updateRadar(my_radar, location_id);
	}
}

function updateRadar(chart, location_id) {
	updateChart(undefined, my_chart);

  var sdg_scores_1 = [];
  var municipio = map_data[location_id].name;
  updateCityGraph( municipio );

  for (x in map_data[location_id].ods){
    sdg_scores_1.push(map_data[location_id].ods[x].score);
  }

  chart.data.datasets[1].data = sdg_scores_1;
  chart.data.datasets[1].label = municipio;

  chart.update({
    duration: 800,
    easing: "linear"
  });

	highlightCityGraph();
	if(window.location.href.includes("profile")){
		updateURL(municipio);
	}
}

/* Función para actualizar la variable global city_graph que contiene el nombre de la ciudad seleccionada en la gráfica */
function updateCityGraph( name_city, ranking_city ) {
	city_graph = name_city;
	if( ranking_city ){
		ranking_city += 1;
		$('#infochart-ranking').html( ranking_city.toString() );
	}
}

//Funcion actualizacion URL
function updateURL(municipio){
	window.history.pushState("","","#"+municipio);
}
/* Función para restaurar el gráfico de barras y el gráfico de radar */
function resetChart(chart) {
	my_chart.destroy();
  createChart();
}

function createChart() {
  var canvas_bars = document.getElementById("my-chart").getContext("2d");
  var canvas_radar = document.getElementById("my-chart-comparative").getContext("2d");
  var placesScores = new Map();
  var radarScores = new Map();
  var sdg_scores_1 = [];
	var sdg_scores_2 = [];
	var radarLabels = [];

  for (i in map_data) {
    placesScores.set(map_data[i].name, Math.round(map_data[i].score * 1000) / 1000);
  }
  for (x in map_data[10037].ods){
    radarScores.set(x,[map_data[10037].ods[x].score,map_data[11004].ods[x].score]);
  }

  $.map(Array.from(radarScores.values()), function(obj) {
    sdg_scores_1.push(obj[0]);
    sdg_scores_2.push(obj[1]);
  });


  var sortedPlacesScores = new Map(
    [...placesScores.entries()].sort((a, b) => b[1] - a[1])
  );

  my_chart = new Chart(canvas_bars, {
    type: "bar",
    data: {
      labels: Array.from(sortedPlacesScores.keys()),
      datasets: [
        {
          label: "Puntuación ",
          data: Array.from(sortedPlacesScores.values()),
          backgroundColor: gray_trans,
          hoverBackgroundColor: default_color,
        }
      ]
    },
    options: {
      tooltips: {
        displayColors: false
      },
      legend: {
        display: false
      },
      title: {
        display: false,
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
              display: false,
              min : 0,
              max : 100
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
              display: false,
              min : 0,
              max : 100
            }
          }
        ]
      }
    }
  })

  my_radar = new Chart(canvas_radar, {
    type: "radar",
    data: {
      labels: ["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17"],
      datasets: [
        {
          label: "España ",
          data: data_general_spain,
          borderColor: gray_trans,
          backgroundColor: gray_trans,
          borderWidth: 2
        },
        {
          label: "",
          data: [],
          borderColor: primary_color,
          backgroundColor: primary_color_50,
          borderWidth: 2
        },
      ]
    },
    options: {
      tooltips: {
				displayColors: false
      },
      legend: {
        display: false
      },
      title: {
        display: false,
        text: "Titulo"
      },
      scale : {
        ticks : {
          min : 0,
          max : 100,
          stepSize : 20
        }
      },
    }
  });
}




function getNameIndicator( value ){
	title = "";
	switch( value ){
		case "2020ratio": title = "Renta disfrutada por el 20% más rico entre el 20% más pobre."; break;
		case "gastosocial": title = "Presupuesto Municipal para la Política de gasto 23. Servicios sociales y promoción social."; break;
		case "rentabaja": title = "Número de declarantes con rentas inferiores a 6.010 € frente a los declarantes totales."; break;
		case "agricultura": title = "Superficie de agricultura ecológica frente a la superficie de agricultura total por provincia"; break;
		case "alimentos": title = "Beneficiarios previstos en plan de ayuda alimentaria a las personas más desfavorecidas frente al total de la población."; break;
		case "consumo": title = "Índice de precios de consumo de alimentos a mayo 2018."; break;
		case "alzheimer": title = "Número de muertes por enfermedad de Alzheimer por cada 100.000 habitantes por provincia"; break;
		case "circulatorio": title = "Número de muertes por enfermedades del sistema circulatorio por cada 100.000 habitantes por provincia"; break;
		case "diabetes": title = "Número de muertes por diabetes mellitus por cada 100.000 habitantes por provincia"; break;
		case "digestivo": title = "Número de muertes por enfermedades del sistema digestivo por cada 100.000 habitantes por provincia"; break;
		case "infantil": title = "Datos de mortalidad infantil por cada 1.000 nacimientos"; break;
		case "infecciosas": title = "Número de muertes por enfermedades infecciosas y parasitarias por cada 100.000 habitantes por provincia"; break;
		case "mentales": title = "Número de muertes por trastornos mentales y del comportamiento por cada 100.000 habitantes por provincia"; break;
		case "respiratorio": title = "Número de muertes por enfermedades del sistema respiratorio por cada 100.000 habitantes por provincia"; break;
		case "suicidios": title = "Número de muertes por suicidios y lesiones autoinfligidas por cada 100.000 habitantes por provincia"; break;
		case "trafico": title = "Número de muertes por accidentes de tráfico por cada 10.000 habitantes"; break;
		case "tumores": title = "Número de muertes por tumores de cualquier tipo por cada 100.000 habitantes por provincia"; break;
		case "vida": title = "Años de esperanza de vida al nacimiento"; break;
		case "estudiantes": title = "Estudiantes en educación superior por cada 1.000 habitantes (ISCED level 5-8 desde 2014 en adelante)"; break;
		case "gastoedu": title = "Presupuesto Municipal para la Política de gasto en Educación (Política de gasto 32. Educación)"; break;
		case "guarderia": title = "Proporción de niños de 0-4 años en guarderías sobre la población de 0-4 años"; break;
		case "isced012": title = "Proporción de población entre 25-64 años con máximo nivel educación ISCED 0, 1 ó 2"; break;
		case "isced56": title = "Proporción de población entre 25-64 años con máximo nivel educación ISCED 5 o 6"; break;
		case "actividadmujer": title = "Proporción de tasa de población activa entre hombres y mujeres"; break;
		case "brechapension": title = "Proporción de percepciones de pensiones entre hombres y mujeres por provincia"; break;
		case "brechasalarial": title = "Proporción de percepciones salariales entre hombres y mujeres por provincia"; break;
		case "denuncias": title = "Número de denuncias por violencia de genero por cada 10.000 habitantes"; break;
		case "desempleomujer": title = "Proporción de tasa de desempleo entre hombres y mujeres"; break;
		case "paridad": title = "Proporción de mujeres concejales electas en las elecciones municipales de 2015"; break;
		case "balanceagua": title = "Balance de Ingresos y Gastos del presupuesto municipal destinado a la gestión del agua"; break;
		case "precioabastecimiento": title = "Precio del abastecimiento doméstico de agua por provincia"; break;
		case "preciosaneamiento": title = "Precio del saneamiento doméstico de agua por provincia"; break;
		case "demanda": title = "Demanda de calor y de frío en el sector residencial por año"; break;
		case "eficiencia": title = "Balance del Presupuesto Municipal para la política de gasto 165 alumbrado público de 2016 frente al de 2012"; break;
		case "facturaelectr": title = "Balance del gasto medio por hogar en electricidad por comunidad autónoma sobre la renta media anual por hogar"; break;
		case "renovable": title = "Potencia instalada en KW de tecnologías de energías renovables en la provincia frente a la total"; break;
		case "suministro": title = "Tiempo de interrupción equivalente de la potencia instalada en media tensión - TIEPI al año"; break;
		case "accidentes": title = "Proporción de accidentes laborales con resultado de baja frente al total de afiliados a la S. Social por provincia"; break;
		case "desempleo": title = "Porcentaje del número de desempleados frente a la población activa total"; break;
		case "desempleojovenes": title = "Porcentaje de menores de 25 años desempleados frente al total de desempleados"; break;
		case "desempleolarga": title = "Porcentaje de desempleados que buscan primer empleo o han dejado su último empleo hace más de un año"; break;
		case "pibcapita": title = "PIB a precios de mercado per capita por provincia "; break;
		case "3g4g": title = "Número de estaciones base UMTS (3G) y LTE (4G) por cada 10.000 habitantes por provincia"; break;
		case "bandaancha": title = "Penetración de lineas FTTH - Líneas por cada 100 habitantes por provincia"; break;
		case "diversidad": title = "Indice de vulnerabilidad a partir de la diversidad de empleo "; break;
		case "gastoidi": title = "Presupuesto Municipal para la Política de gasto en I+D+i (Política de gasto 46. Investigación, desarrollo e innovación)"; break;
		case "patentes": title = "Número de patentes solicitadas por cada 10.000 habitantes por provincia"; break;
		case "tiempo": title = "Duración media del desplazamiento al trabajo en minutos "; break;
		case "agedependency": title = "Proporción de población entre 0-19 y mayores de 65 frente a la población entre 20-64 años"; break;
		case "discapacitados": title = "Proporción de contratos a personas con discapacitad sobre el total de contratos por provincia"; break;
		case "extranjeros": title = "Proporción de afiliados a la seguridad social de extranjeros frente al total de extranjeros censados de la provincia"; break;
		case "igini": title = "Coeficiente de Gini calculado a nivel municipal"; break;
		case "top1": title = "Concentración de la renta local entre los declarantes con mayores ingresos de cada municipio (1%, 0,5% y 0,1%)"; break;
		case "infraestructura": title = "Superficie del territorio municipal dedicado a zonas verdes e instalaciones deportivas per capita"; break;
		case "no2": title = "Valor medio de Dioxido de Nitrógeno NO2 durante el año "; break;
		case "o3": title = "Número de días del año que se ha superado 100 μg/m3 (límite OMS) durante períodos de 8 horas"; break;
		case "pm10": title = "Número de días durante el año en que se han superado los 50 μg/m3 (límite OMS) de partículas PM10"; break;
		case "preciovivienda": title = "Proporción del precio de la vivienda libre frente a la renta bruta anual por hogar"; break;
		case "resiliencia": title = "Índice de resiliencia urbana"; break;
		case "transporte": title = "Proporción entre los desplazamientos al trabajo en transporte público y a pie frente a los desplazamientos en coche"; break;
		case "viviendaprotegida": title = "Proporción entre el número de calificaciones de viviendas protegidas acumuladas desde 1991 hasta 2017 frente al parque total de viviendas"; break;
		case "vulnerabilidad": title = "Proporción de población que vive secciones censales vulnerables frente al total poblacion"; break;
		case "zonasverdes": title = "Porcentaje de población con acceso a áreas verdes urbanas a 10 minutos andando"; break;
		case "papel": title = "Cantidad de envases de papel y cartón recogidos por habitante al año"; break;
		case "plastico": title = "Cantidad de envases ligeros recogidos (envases de plástico, envases de metal y bricks) por habitante y año"; break;
		case "residuos": title = "Proporción de material de envases recuperado al año frente al total recuperado por provincia"; break;
		case "vidrio": title = "Cantidad de vidrio recogido por habitante al año "; break;
		case "co2": title = "Toneladas de emisiones de CO2 per capita a nivel provincial "; break;
		case "nep": title = "Productividad neta del ecosistema medida mediante la eliminación o liberacion de CO2 a la atmósfera por provincia"; break;
		case "riesgo": title = "Índice riesgo de inundación en las áreas urbanas según su exposición natural y su sensibilidad a las inundaciones"; break;
		case "calidad": title = "Proporción de playas urbanas con calidad de las aguas excelente frente al total de playas urbanas"; break;
		case "costa": title = "Proporción de suelo construido en la franja costera de los primeros 10 km frente al total por provincia"; break;
		case "dpmt": title = "Proporción de tramos de costa pública del DPMT construida frente al total por provincia"; break;
		case "habitats": title = "Proporción de superficie de costa y habitats naturales marinos protegidos frente al total por provincia"; break;
		case "natura": title = "Superficie de zonas naturales per capita "; break;
		case "protec": title = "Proporción de los espacios naturales protegidos frente al total de la provincia"; break;
		case "verdes": title = "Superficie de zonas verdes artificiales públicas y privadas por municipio per cápita"; break;
		case "blanqueo": title = "Número de infracciones por blanqueo de capitales y tráfico de drogas por cada 100.000 habitantes por provincia"; break;
		case "homicidios": title = "Número de homicidios dolosos y asesinatos por cada 100.000 habitantes"; break;
		case "ita": title = "Índice de Transparencia Municipal ITA - Transparencia Internacional"; break;
		case "participa": title = "Proporción de participación en las Municipales de 2015 y Nacionales de 2016 frente al total de población censada"; break;
		case "violencia": title = "Número de victimizaciones de infracciones penales por grupo de edad (0 a 13 años) por 10.000 habitantes"; break;
		case "coop": title = "Presupuesto destinado a proyectos de Cooperación y Ayudas al Desarrollo (2012-2016) per capita"; break;
		case "redes": title = "Presencia en redes nacionales de ciudades para lograr objetivos relacionados con el desarrollo sostenible."; break;
		case "solidez": title = "Proporción presupuestaria entre ingresos de recursos propios frente al total de los ingresos"; break;
	}
	return title;
}



/* Función para poder incluir fragmentos en páginas */
function includeHTML() {
  var z, i, elmnt, file, xhttp;
  /*loop through a collection of all HTML elements:*/
  z = document.getElementsByTagName("*");
  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    /*search for elements with a certain atrribute:*/
    file = elmnt.getAttribute("w3-include-html");
    if (file) {
      /*make an HTTP request using the attribute value as the file name:*/
      xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status == 200) {elmnt.innerHTML = this.responseText;}
          if (this.status == 404) {elmnt.innerHTML = "Page not found.";}
          /*remove the attribute, and call this function once more:*/
          elmnt.removeAttribute("w3-include-html");
          includeHTML();
        }
      }
      xhttp.open("GET", file, true);
      xhttp.send();
      /*exit the function:*/
      return;
    }
  }

  /* 
  |	Aunque deberíamos ejecutar la función cuando el documento está listo,
	|	la lanzamos aquí para aplicarlo en los includes. Si detectamos algún fallo o retardo
	| meterla en la función inicial.
	*/
  addBaseURL();
  changeVersion();
}

/* Función para añadir a los enlaces el url_base */
function addBaseURL() {
	var z, i, elmnt;
	z = document.getElementsByTagName('*');
	for( i=0; i<z.length; i++) {
		elmnt = z[i];
		data_conf = elmnt.getAttribute("data_conf");

		if( data_conf=="base_url" ) {

			if(elmnt.href){
				elmnt.href = url_base + $(elmnt).attr("href");
			}else{
				var new_src = url_base + $(elmnt).attr("src");
				$(elmnt).attr("src", new_src);
			}
			elmnt.removeAttribute("data_conf");
		}
	}
}

function changeVersion() {
	$("#version").text( version_app );
	$("#version_navbar").text( version_app );
}