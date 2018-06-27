function processArticle(articleData, oldLastArtIdsTab, searchRowIndex, currentSearchAddedArticlesNb) {
  var artUrl = "https://www.leboncoin.fr" + getAttrValue('href', articleData, '<a'); // lien vers le détail du 1er article
  var artId = extractid(artUrl);
  log("artUrl = \"" + artUrl + "\"", levels.debug);
  log("artId = " + artId, levels.debug);

  if(isAlreadyProcessedArticle(oldLastArtIdsTab, artId)){
    log("Article '" + artId + "' déjà traité", levels.debug);
  } else {
    try {
      oldLastArtIdsTab.push(artId); // on ajoute l'élément au tableau des articles déjà traités
      oldLastArtIdsTab.sort(function(a, b){return b-a}); // on trie le tableau de manière décroissante
      log("oldLastArtIdsTab.valueOf() = " + oldLastArtIdsTab.valueOf(), levels.debug);
      if (logLevel < levels.debugReadOnly) {
        dataSheet.getRange(searchRowIndex,lastProductIdColomn).setValue(oldLastArtIdsTab.toString()) // on met à jour la cellule correspondante du classeur
      }
      log("Nouvel article ajouté : " + artId, levels.info);
    } catch (err) {
      log("ERREUR lors de l'ajout de l'article '" + artId + "'\n" + err, levels.error);
    }
    //var isProStartIndex = articleData.indexOf('<p class="item_supp">');
    //var isProStartIndex = articleData.indexOf('<span class="ispro">');

    var title = getAttrValue('title', articleData);
	if(title != '') {
      var place = getMarkersContentByAttr('p', articleData, 'aditem_location');
      var price = parseInt(getMarkersContentByAttr('span', articleData, 'itemprop="price"'));
      log("title = " + title + '\n'
        + "place = " + place + '\n'
        + "price = " + price + '\n', levels.debug);
      var priceDisplayed = price + "&nbsp;&euro; - ";
      if (isNaN(price)) priceDisplayed = '';
      if ( isNaN(price) || (minPrice == "" || price > minPrice) && (maxPrice == "" || price < maxPrice) ) {
        currentSearchAddedArticlesNb++;
        var imgNb = getImgNb(articleData);
        body = body + "<li><a href=\"" + artUrl + "\">" + title + "</a> (" + priceDisplayed + place + ") - " + imgNb + ' photos';
        // affichage de l'image
        if (imgNb > 0) {
         var imgSrc = getImgUrl(artUrl);
         log("imgSrc = " + imgSrc, levels.debug);
         body = body + "<br/><a href=\"" + artUrl + '"><img src="' + imgSrc + '" height="140"/></a>';
        }
        body = body  + "</li>";
      }
	}
  }

} 

/**
 * Récupère le nombre d'images pour l'article
 */
function getImgNb(articleData) {
  var cameraDataIndex = articleData.indexOf('camera');
  var imgNb = 0;
  if (cameraDataIndex > 0) {
    var cameraData = articleData.substring(cameraDataIndex);
  imgNb = getMarkersContent('span', cameraData);
  }
  return imgNb;
}

/**
 * Récupère l'url de l'image associée à un article
 */
function getImgUrl(artUrl) {
  var rep = UrlFetchApp.fetch(artUrl).getContentText();
  var data = rep.substring(rep.indexOf('adview_gallery_container'));
  return getAttrValue('src', data, 'img');  
}

/**
* Extraction de l'id d'un article à partir de l'url de détail de l'article
*/
function extractid(url){
  return url.substring(url.indexOf("/",25) + 1, url.indexOf(".htm"));
}

/**
* Récupération du code HTML de la liste des articles
*/
function getArticlesListDivData(html){
  var startListArticlesTab = html.indexOf('<li', html.indexOf('<div class="react-tabs__tab-panel react-tabs__tab-panel--selected"'));
  var endListArticlesTab = html.indexOf('</ul>', startListArticlesTab);
  return html.substring(startListArticlesTab, endListArticlesTab);
}