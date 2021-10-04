// ==UserScript==
// @name         WayfarerQOL
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Wayfarer QOL improvements
// @author       sp00x
// @match        https://wayfarer.nianticlabs.com/*
// @grant        none
// ==/UserScript==

// document.querySelectorAll("app-review-rejection-abuse-modal mat-accordion mat-expansion-panel mat-expansion-panel-header")[0].click()
// -- span.mat-content = text inside
// document.querySelectorAll("app-review-rejection-abuse-modal mat-accordion mat-expansion-panel .mat-expansion-panel-content")[0].querySelectorAll("mat-selection-list mat-list-option")[2].click()

(function() {
    'use strict';

    const elemId = "waifoo49";

    let review = null;
    let reviewStep = 0;
    let profile = null;
    let manage = null;
    let suppressNextClick = false;

    let elem = document.getElementById(elemId);

    let maps = [
      {"title":"UT","url":"https://ut.no/kart#17/%lat%/%lng%"},
      {"title":"Norgeskart","url":"https://spoox.org/lat-lng-utm.html?lat=%lat%1&lng=%lng%&zone=33&url=https%3A//norgeskart.no/%23%21%3Fproject%3Dseeiendom%26layers%3D1002%2C1014%26zoom%3D17%26lat%3D%25northingFull%25%26lon%3D%25eastingFull%25%26sok%3D%title%%26markerLat%3D%25northingFull%25%26markerLon%3D%25eastingFull%25%26panel%3DsearchOptionsPanel"},
      {"title":"Norge i bilder","url":"https://spoox.org/lat-lng-utm.html?lat=%lat%&lng=%lng%&url=https%3A//norgeibilder.no/%3Fx%3D%25easting%25%26y%3D%25northing%25%26level%3D16%26utm%3D%25zoneNum%25"},
      //  {"title":"Kulturminnesøk","url":"https://www.kulturminnesok.no/search?lat=%lat%&lng=%lng%"},
      {"title":"Kommunekart","url":"https://www.kommunekart.com/?funksjon=Vispunkt&x=%lat%&y=%lng%&zoom=17&markering=1"},
      {"title":"Finn","url":"https://kart.finn.no/?lng=%lng%&lat=%lat%&zoom=17&mapType=normap&markers=%lng%,%lat%,r,"},
      {"title":"OSM", "url":"https://www.openstreetmap.org/#map=18/%lat%/%lng%"}
    ]
    maps.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }));

    let reviewSteps = [
        { sel: "app-should-be-wayspot", type: "rate" },
        { sel: "app-title-and-description", type: "rate" },
        { sel: "app-supporting-info" },
        { sel: "app-check-duplicates", type: "dupes" },
        { sel: "app-historic-cultural-significance", type: "rate" },
        { sel: "app-visually-unique", type: "rate" },
        { sel: "app-safe-access", type: "rate" },
        { sel: "app-location-accuracy", type: "rate" },
        { sel: "app-location-accuracy", type: "dupes" },
        { sel: "app-review-categorization", type: "category" },
        { sel: "app-review-comments" }
    ];

    function patchNew() {
        //console.log("--- patchNew", review);
        if (review && review.result.type == "NEW") {
            //console.log("review type is NEW");
            let reviewAppEl = document.querySelector("app-review");
            if (reviewAppEl) {
                //console.log("found review app", reviewAppEl);
                reviewSteps.forEach((step, index) => {
                    if (step.type == "rate") {
                        //console.log("attempt to patch rating", step);
                        patchRating(step.sel, index);
                    } else if (step.type == "dupes") {
                      // patch in links to maps
                      patchDupes(step.sel, index);
                    }
                });
            } else {
                console.error("could not find review app");
            }
        }
    }

    function updateFocusHelpers() {
        console.log("update focus helpers..");
        reviewSteps.forEach((step, index) => {
            if (step.type == "rate" && step.rating && step.rating.starsEl) {
                let css = index == reviewStep ? "1px solid red" : "";
                console.log("### set " + index + " to: " + css + "   (active: " + reviewStep + ")");
                step.rating.starsEl.style.border = css;
            }
        });
    }

    function clickedStep(index) {
        console.log("clicked step " + index);
        reviewStep = index;
        updateFocusHelpers();
    }

    function patchDupes(sel, index) {
      let headerEl = document.querySelector(`${sel} wf-review-card .wf-review-card__header div`);
      if (headerEl) {
        if (!headerEl.getAttribute("__FOO")) {
          headerEl.setAttribute("__FOO", "__BAR");
          let div = document.createElement("div");
          maps.forEach((map, i) => {
            if (i) {
              div.appendChild(document.createTextNode(" | "));
            }
            let a = document.createElement("a");
            let url = map.url.replace(/%lat%/g, review.result.lat).replace(/%lng%/g, review.result.lng);
            a.href = url;
            a.target = "_blank";
            a.appendChild(document.createTextNode(map.title));
            div.appendChild(a);
          })
          headerEl.appendChild(div);
        }
      }
    }

    function patchRating(sel, index) {
        let starsEl = document.querySelector(`${sel} wf-rate ul`);
        let starEls = document.querySelectorAll(`${sel} wf-rate ul li`);
        if (starsEl && starEls) {
            if (!starsEl.getAttribute("__FOO")) {
                starsEl.addEventListener("click", function() {
                    clickedStep(index);
                });
                reviewSteps[index].rating = { starsEl, starEls };
            } else {
                starsEl.setAttribute("__FOO", "__BAR");
            }
        } else {
            console.log("could not find stars elements");
            reviewSteps[index].rating = null;
        }
        // document.querySelectorAll("app-should-be-wayspot wf-rate ul li")[3].click()
    }

    function patch() {
        elem = document.getElementById(elemId);
        if (!elem) {
            elem = document.createElement("div");
            elem.style = `box-sizing: border-box; padding: 0; margin: 0;`;
            elem.id = elemId;
            elem.innerHTML = `Loading..`;

            let header = document.querySelector("app-header > div");
            if (header) {
                header.insertBefore(elem, header.lastElementChild);
            }
        }
    }

    function gotoNextStep() {
        console.log("gotoNextStep: is at " + reviewStep);
        for (let i = reviewStep + 1; reviewSteps.length > i; i++) {
            let nextStep = reviewSteps[i];
            console.log("  check", i, nextStep);
            if (nextStep.type == "rate") {
                reviewStep = i;
                if (reviewStep.rating) {
                    reviewStep.rating.starEls.focus();
                }
                break;
            }
        }
        updateFocusHelpers();
    }

    function handleRating(rating) {
        console.log("#### handleRating", rating);
        if (review && review.result && review.result.type == "NEW") {
            let step = reviewSteps[reviewStep];
            if (step && step.type == "rate" && step.rating) {
                console.log("### click star number: " + (rating+1));
                //suppressNextClick = true;
                step.rating.starEls[rating].click();
                gotoNextStep();
            }
        }
    }

    function handleSpaceKey() {
        console.log("#### handle space key");
        if (review && review.result && review.result.type == "NEW") {
            let step = reviewSteps[reviewStep];
            console.log("   current step", step);
            if (step) {
                reviewStep = reviewStep + 1;
                // if (step.rating && step.rating.starsEl) {
                //     step.rating.starsEl.scrollIntoView();
                // }
                updateFocusHelpers();
            }
        }
    }

    document.addEventListener("keydown", key => {
        console.log("### key down", key);
        switch (key.key) {
            case " ":
                handleSpaceKey();
                return;
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
                handleRating(parseInt(key.key) - 1);
                return;
        }
        switch (key.code) {
            case "Space":
                handleSpaceKey();
                return;
            case "Digit1":
            case "Digit2":
            case "Digit3":
            case "Digit4":
            case "Digit5":
                handleRating(parseInt(key.substring("Digit".length)) - 1);
                return;
        }
    });

    function update() {
        if (!elem) return;
        let html = "";
        if (review) {
            let exp = Math.floor((review.result.expires - Date.now()) / 1000);
            let expMin = Math.floor(exp / 60);
            let expSec = exp % 60;
            let expText = (expMin+100).toString().substr(-2) + ':' + (expSec+100).toString().substr(-2);
            html += `${review.result.type} - <span style="font-size: 1.2em; font-weight: bold">${expText}</span>`;
        }
        elem.innerHTML = html;

        patchNew();

        // let btn = document.createElement("button");
        // btn.innerHTML = "patch"
        // btn.onclick = () => patchNew();
        // elem.appendChild(btn);

    }

    let iv = setInterval(function() {
        patch();
        if (review) {
            update();
        }
    }, 1000);

    console.log("#### INJECT..");

    let xhrOpen = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function() {
        console.log("#### OPEN", { method: arguments[0], url: arguments[1] });
        this.addEventListener("readystatechange", function() {
            if (this.readyState == 4) {
                console.log("#### RESPONSE", { url: this.responseURL, status: this.status, text: this.responseText });
                if (this.status == 200 && this.responseURL.endsWith("https://wayfarer.nianticlabs.com/api/v1/vault/review")) {
                    try {
                        review = JSON.parse(this.responseText);
                        reviewStep = 0;
                        update();
                    } catch (err) {
                        console.error("error parsing review JSON:", { err, text: this.responseText });
                    }
                }
            }
            //console.log("#### READYSTATECHANGE", { xhr: this });
        }, false);
        xhrOpen.apply(this, arguments);
    };

    console.log("#### INJECTED");

})();