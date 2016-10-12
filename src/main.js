/* jshint esnext: true */

import * as d3 from 'd3';
import $ from 'jquery';
import TweenMax from 'gsap';
import {highlightTeam, highlightAll} from './highlighter.js';

require('./sass/style.scss');

const margin = {top: 0, right: 60, bottom: 50, left: 100};
const width = 960 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

const dataMargin = {top: 10, right: 14, bottom: 5, left: 5};
const dataWidth = width - dataMargin.left - dataMargin.right;
const dataHeight = height - dataMargin.top - dataMargin.bottom;

let current_x_min = 0;
let panOffset = 0;

let pinned = false;

const x = d3.scaleLinear()
  .domain([current_x_min, current_x_min + 10])
  .range([dataMargin.left, dataWidth]);

const y = d3.scaleLinear()
  .domain([1, 30])
  .range([dataMargin.top, dataHeight]);

const line = d3.line()
  .curve(d3.curveMonotoneX)
  .x(d => x(d.week))
  .y(d => y(d.rank));

const format = d3.format(".01f");

d3.json('http://api.nathanemyers.com/nba/rankings/2016', function(error, json) {
  if (error) {
    return console.warn(error);
  }
  $('#spinner-container').css('display', 'none');

  createChart(json);
});


function createChart(data) {
  /*
   * D3.js Code
   */
  const outer = d3.select(".chart").append("svg")
      .attr('id', 'outer')
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

  const inner = outer
    .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
    .append("svg")
      .attr('id', 'inner')
      .attr("width", dataWidth + dataMargin.left + dataMargin.right)
      .attr("height", dataHeight + dataMargin.top + dataMargin.bottom)
    .append('g')
      .attr("transform", `translate(${dataMargin.left}, ${dataMargin.top})`);

  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisRight(y)
                .tickValues([1, 5, 10, 15, 20, 25, 30]);

  const gX = outer.append('g')
    .attr('transform', `translate(${margin.left + dataMargin.left}, 
                                  ${dataHeight + margin.top + dataMargin.top + dataMargin.bottom})`)
    .call(xAxis);

  gX.append('text')
      .text('Week')
      .attr('fill', 'black')
      .attr('font-size', 15)
      .attr('transform', `translate(${width / 2}, 40)`);


  const gY = outer.append('g')
    .attr('transform', `translate(${margin.left}, 
                                  ${margin.top + dataMargin.top})`);

  const rankAxis = outer.append('g')
    .attr('transform', `translate(${margin.left + dataMargin.left + width}, 
                                  ${margin.top + dataMargin.top})`)
    .call(yAxis)
    .append('text')
      .text('Rank')
      .attr('fill', 'black')
      .attr('font-size', 15)
      .attr('transform', `translate(40, ${height / 2}) rotate(-90)`);


  const labels = gY.selectAll('.team-label')
    .data(data)
    .enter().append('text')
      .attr('class', d => `${d.css_slug} team-label`)
      .attr('text-anchor', 'end')
      .attr('transform', d => `translate(0, ${y(d.rankings[current_x_min].rank) + 5})`)
      .text(d => d.name)
      .call(attachHighlightHandle);

  const team = inner.selectAll('.team')
    .data(data)
    .enter().append('g')
      .attr('class', d => `${d.css_slug} team`);

  team.append('path')
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

  const teamHandles = inner.selectAll('.team-handle')
    .data(data)
    .enter().append('g')
      .attr('class', d => `${d.css_slug} team-handle`)
    .append('path')
      .attr('d', d => line(d.rankings))
      .style('stroke', 'none')
      .style('fill', 'none')
      .style('stroke-width', 13)
      .style('pointer-events', 'stroke')
      .attr('team', d => d.css_slug)
      .call(attachHighlightHandle);

  const playoffs = inner.append('g')
      .attr('class', 'playoffs-marker');
  const playoffsElements = playoffs.append('g')
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


  /*
   *Panning Controls
   */

  function panLeft() {
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

  const leftButton = d3.select('#left-button')
    .on('click', function() {
      d3.event.stopPropagation();
      panLeft();
    });
  const rightButton = d3.select('#right-button')
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

  function zoomed() {
    team.attr('transform', d3.event.transform);
    teamHandles.attr('transform', d3.event.transform);
    playoffs.attr('transform', d3.event.transform);
    gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));

    let x_min = format(x.invert(-d3.event.transform.x));
    let xFloor = Math.floor(x_min); //TODO xFloor will resolve to -1 on first pan vvv
    let xCeil = Math.ceil(x_min);
    let percent = d3.easeCubic(x_min % 1);

    labels.attr('transform', function(d) {
      let floor = y(d.rankings[xFloor].rank); //TODO this will break right here ^^^
      let ceil = y(d.rankings[xCeil].rank);
      let travel = ceil - floor;
      let newY = floor + ( travel * percent );
      return `translate(0, ${newY})`;
    });
  }

  var zoom = d3.zoom()
    .on('zoom', zoomed)
    .translateExtent([[0,0], [3200, height + margin.top + margin.bottom]])
    .scaleExtent([1,1]);

  // Animate all this garbage in
  
  // find initial rankings for greensock
  let start_rankings = new Array(30);
  data.forEach(function(team) {
    let rank = team.rankings[0].rank;
    start_rankings[rank - 1] = '.' + team.css_slug;
  });
  start_rankings.reverse();

  TweenMax.staggerFrom(start_rankings, 1, {opacity: 0}, 0.025);


  function pin(slug) {
    d3.event.stopPropagation();
    highlightAll();
    highlightTeam(slug);
    pinned = true;
  }

  function centerOn(base) {
    panOffset = x(base); 
    let t = d3.zoomIdentity.translate(-panOffset, 0);
    outer.transition()
      .duration(200)
      .call(zoom.transform, t);
  }

  window.onclick = function () {
    highlightAll();
    pinned = false;
  };

  function attachHighlightHandle(selection) {
    return selection
      .on('click', team => pin(team.css_slug))
      .on('mouseover', team => {
        if (team && !pinned) {
          highlightTeam(team.css_slug);
          d3.select(`.${team.css_slug}.team-handle`).raise();
        }
      })
      .on('mouseout', () => {
        if (!pinned) {
          highlightAll();
        }
      });
  }
}

