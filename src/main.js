/* jshint esnext: true */

import * as d3 from 'd3';
import $ from 'jquery';
import TweenMax from 'gsap';

require('./sass/style.scss');

let data;

const margin = {top: 0, right: 60, bottom: 50, left: 100};
const width = 960 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const dataMargin = {top: 10, right: 14, bottom: 5, left: 5};
const dataWidth = width - dataMargin.left - dataMargin.right;
const dataHeight = height - dataMargin.top - dataMargin.bottom;

let zoomedOut = false;
let current_x_min = 0;
let panOffset = 0;

let discrete_mode = false; // this is a kludge to fix centerOn bug
let pinned = false;

let x = d3.scaleLinear()
  .domain([current_x_min, current_x_min + 10])
  .range([dataMargin.left, dataWidth]);

let y = d3.scaleLinear()
  .domain([1, 30])
  .range([dataMargin.top, dataHeight]);

const line = d3.line()
  .curve(d3.curveMonotoneX)
  .x(d => x(d.week))
  .y(d => y(d.rank));

const voronoi = d3.voronoi()
  .x(d => d.x)
  .y(d => d.y)
  .size([x(24), height]);

const format = d3.format(".01f");

window.onload = function() {
  d3.json('http://api.nathanemyers.com/nba/rankings/2016', function(error, json) {
    if (error) {
      return console.warn(error);
    }
    data = json;
    $('#spinner-container').css('display', 'none');

    // find initial rankings for greensock
    let start_rankings = new Array(30);
    data.forEach(function(team) {
      let rank = team.rankings[0].rank;
      start_rankings[rank - 1] = '.' + team.css_slug;
    });
    start_rankings.reverse();

    /*
     * D3.js Code
     */
    let outer = d3.select(".chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom);

    let inner = outer
      .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .append("svg")
        .attr("width", dataWidth + dataMargin.left + dataMargin.right)
        .attr("height", dataHeight + dataMargin.top + dataMargin.bottom)
      .append('g')
        .attr("transform", `translate(${dataMargin.left}, ${dataMargin.top})`);

    let xAxis = d3.axisBottom(x);
    let yAxis = d3.axisRight(y)
                  .tickValues([1, 5, 10, 15, 20, 25, 30]);

    let gX = outer.append('g')
      .attr('transform', `translate(${margin.left + dataMargin.left}, 
                                    ${dataHeight + margin.top + dataMargin.top + dataMargin.bottom})`)
      .call(xAxis);

    gX.append('text')
        .text('Week')
        .attr('fill', 'black')
        .attr('font-size', 15)
        .attr('transform', `translate(${width / 2}, 40)`);


    let gY = outer.append('g')
      .attr('transform', `translate(${margin.left}, 
                                    ${margin.top + dataMargin.top})`);

    let rankAxis = outer.append('g')
      .attr('transform', `translate(${margin.left + dataMargin.left + width}, 
                                    ${margin.top + dataMargin.top})`)
      .call(yAxis)
      .append('text')
        .text('Rank')
        .attr('fill', 'black')
        .attr('font-size', 15)
        .attr('transform', `translate(40, ${height / 2}) rotate(-90)`);


    let labels = gY.selectAll('.team-label')
      .data(data)
      .enter().append('text')
        .attr('class', d => `${d.css_slug} team-label`)
        .attr('text-anchor', 'end')
        .attr('transform', d => `translate(0, ${y(d.rankings[current_x_min].rank) + 5})`)
        .text(d => d.name)
        .on('click', team => pin(team.css_slug))
        .on('mouseover', team => {
            if (team && !pinned) {
              highlightTeam(team.css_slug);
            }
          })
        .on('mouseout', () => {
            if (!pinned) {
              highlightAll();
            }
          });

    let team = inner.selectAll('.team')
      .data(data)
      .enter().append('g')
        .attr('class', d => `${d.css_slug} team`);

    team
      .append('path')
        .attr('d', d => line(d.rankings))
        .style('fill', 'none')
        .style('stroke-width', 1.5)
        .style('stroke', d => d.color)
        .attr('team', d => d.css_slug);

    team.selectAll('circle')
      .data(d => d.rankings)
      .enter().append('circle')
        .attr('cx', d => x(d.week))
        .attr('cy', d => y(d.rank))
        .attr('r', '5px')
        .style('opacity', 0)
        .style('fill', d => d.color);

    let playoffs = inner.append('g')
        .attr('class', 'playoffs-marker');
    let playoffsElements = playoffs.append('g')
        .attr('transform', `translate(${x(24) + 10}, ${dataHeight + dataMargin.top}) rotate(-90)`);
    playoffsElements.append('path')
      .attr('stroke-width', 2.4)
      .attr(`d`, `M15 0 H ${dataHeight - 7}`);
    playoffsElements.append('rect')
      .style('fill', 'white')
      .style('stroke', 'white')
      .attr('width', `100`)
      .attr('height', `20`)
      .attr(`transform`, `translate(${dataHeight/2 - 50}, -10)`);
    playoffsElements.append('text')
      .attr('text-anchor', 'middle')
      .attr(`transform`, `translate(${dataHeight/2}, 5)`)
      .text('Playoffs Begin');

    let zoom = d3.zoom()
      .on('zoom', zoomed)
      .on('end', centerOnNearestBase)
      .translateExtent([[0,0], [3200, height + margin.top + margin.bottom]])
      .scaleExtent([1,1]);

    let zoomHandle = inner.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'zoom-handle')
      .call(zoom);

    generateVoronoi();

    function generateVoronoi() {
      let voronoiData = voronoi.polygons(generateVoronoiPoints($('.team path')));
      inner.selectAll('.voronoi').remove();
      inner.selectAll('.voronoi').data(voronoiData)
        .enter().append('g')
          .attr('class', d => 'voronoi')
        .append('path')
          .attr('d', d => d ? "M" + d.join("L") + "Z" : null)
          .on('click', team => pin(team.data.css_slug))
          .on('mouseover', team => {
              if (team && !pinned) {
                highlightTeam(team.data.css_slug);
              }
            })
          .on('mouseout', () => {
              if (!pinned) {
                highlightAll();
              }
            });
    }

    window.onclick = function () {
      highlightAll();
      pinned = false;
    };

    function zoomed() {
      team.attr('transform', d3.event.transform);
      playoffs.attr('transform', d3.event.transform);
      inner.selectAll('.voronoi').attr('transform', d3.event.transform);
      gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));

      let x_min = format(x.invert(-d3.event.transform.x));
      let xFloor = Math.floor(x_min);
      let xCeil = Math.ceil(x_min);
      let percent = d3.easeCubic(x_min % 1);

      labels.attr('transform', function(d) {
        let floor = y(d.rankings[xFloor].rank);
        let ceil = y(d.rankings[xCeil].rank);
        let travel = ceil - floor;
        let newY = floor + ( travel * percent );
        return `translate(0, ${newY})`;
      });
    }

    /*
     * Panning Logic
     */
    function centerOnNearestBase() {
      if (discrete_mode) {
        // there's a bug here where if you hit the pan buttons too fast
        // we get into an infinite loop trying to center while another
        // zoom event is happening
        return;
      }
      let base = format(x.invert(-d3.event.transform.x)); // where the left hand of the axis lies
      let roundedBase = format(Math.round(base));
      if (Math.abs(x(roundedBase - base)) > 1)  {
        // if we're more than 1 pixel off
        centerOn(roundedBase);
      }
    }

    function centerOn(base) {
      panOffset = x(base); 
      let t = d3.zoomIdentity.translate(-panOffset, 0);
      zoomHandle
        .transition()
        .duration(200)
        .call(zoom.transform, t);
    }


    /*
     *Panning Controls
     */
    $('.button').on('click', (e) => {
    });
    
    let leftButton = d3.select('#left-button')
      .on('click', function() {
        d3.event.stopPropagation();
        panLeft();
      });
    let rightButton = d3.select('#right-button')
      .on('click', function() {
        d3.event.stopPropagation();
        panRight();
      });

    d3.select('body')
      .on('keydown', () => {
        if (d3.event.key === 'ArrowLeft') {
          panLeft();
        }
        if (d3.event.key === 'ArrowRight') {
          panRight();
        }
      });

    function panLeft() {
      discrete_mode = true;
      if (current_x_min > 0) {
        TweenMax.fromTo('#left-button', 1, {
          backgroundColor: '#bada55'
        }, {
          backgroundColor: '#fff',
          ease: Power1.easeOut
        });
        current_x_min--;
        centerOn(current_x_min);
      }
    }

    function panRight() {
      discrete_mode = true;
      if (current_x_min + 10 < 24) {
        TweenMax.fromTo('#right-button', 1, {
          backgroundColor: '#bada55'
        }, {
          backgroundColor: '#fff',
          ease: Power1.easeOut
        });
        current_x_min++;
        centerOn(current_x_min);
      }
    }

    // Animate all this garbage in
    TweenMax.staggerFrom(start_rankings, 1, {opacity: 0}, 0.025);

    /*
     *I'm having trouble reconciling using zoom to pan
     *and using scales to effect zooming in and out.
     *One solution might be to zoom the scale only on one
     *dimension, but I don't belive that's an option.
     *Leaving this code in here for future reference.
     */
    //let zoomButton = d3.select('#zoom')
      //.on('click', function() {
        //d3.event.stopPropagation();
        //if (zoomedOut) {
          //x.domain([current_x_min, current_x_min + 10]);
          //xAxis.scale(x);
          //x.range([dataMargin.left, dataWidth]);
          //settleZoom(500);
          //zoomedOut = false;
        //} else {
          //x.domain([0, 24]);
          //xAxis.scale(x);
          //x.range([dataMargin.left + panOffset, dataWidth + panOffset]);
          //settleZoom(500);
          //zoomedOut = true;
        //}
      //});

    //function settleZoom(duration) {
      //gX.transition()
        //.duration(duration)
        //.call(xAxis)
      //// slight kludge, we just want to to do this once
        //.on('end', generateVoronoi); 

      //team.selectAll('path')
        //.transition()
        //.duration(duration)
        //.attr('d', d => line(d.rankings));
        
      //team.selectAll('circle')
        //.transition()
        //.duration(duration)
        //.attr('cx', d => x(d.week))
        //.attr('cy', d => y(d.rank));
    //}
  }); // End of window.onload

  function pin(slug) {
    d3.event.stopPropagation();
    highlightAll();
    highlightTeam(slug);
    pinned = true;
  }

  function highlightTeam(slug) {
    d3.selectAll('.team > path')
      .transition()
      .duration(15)
      .ease(d3.easeLinear)
      .style('stroke-width', d => (slug === d.css_slug) ? '3px' : '1px')
      .style('stroke', d => (slug === d.css_slug) ? d.color : 'gray');

    d3.selectAll('.team-label')
      .transition()
      .duration(15)
      .attr('fill', d => (slug === d.css_slug) ? 'black' : 'gray')
      .attr('font-weight', d => (slug === d.css_slug) ? 900 : 100);

    d3.selectAll(`.${slug} > circle`)
      .transition()
      .duration(200)
      .ease(d3.easeLinear)
      .style('opacity', 1);
  }

  function highlightAll() {
    d3.selectAll('.team path')
      .transition()
      .duration(15)
      .ease(d3.easeLinear)
      .style('stroke', d => d.color)
      .style('stroke-width', '1.5px');

    d3.selectAll('.team-label')
      .transition()
      .duration(15)
      .attr('font-weight', 100)
      .attr('fill', 'black');

    d3.selectAll('.team circle')
      .transition()
      .duration(15)
      .ease(d3.easeLinear)
      .style('opacity', 0);
  }

  /*
   * Voronoi Support Code
   */
  function samplePath(pathNode, precision) {
    let pathLength = pathNode.getTotalLength();
    let samples = [];
    for (let sample, sampleLength = 0; sampleLength <= pathLength; sampleLength += precision) {
      sample = pathNode.getPointAtLength(sampleLength);
      samples.push({
        x: sample.x,
        y: sample.y,
        slug: pathNode.__data__.css_slug // there is surely a better way to get this
      });
    }
    return samples;
  } 

  function generateVoronoiPoints(paths) {
    let allPoints = [];
    for (let path of paths) {
      allPoints = allPoints.concat( samplePath(path, 15) );
    }
    return allPoints;
  }


};
