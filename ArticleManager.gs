function processArticle(articleData, oldLastArtIdsTab, searchRowIndex, currentSearchAddedArticlesNbTab) {
  //var artUrlStartIndex = articleData.indexOf("<a href") + 9; // index de la 1ère url de la liste
  //var artUrl = "http:" + articleData.substring(artUrlStartIndex , articleData.indexOf(".htm", artUrlStartIndex) + 4); // lien vers le détail du 1er article
  //var artId = extractid(artUrl);

  var artUrl = "https://www.leboncoin.fr" + getAttrValue('href', articleData, '<a');
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
    //var title = articleData.substring(articleData.indexOf("title=") + 7 , articleData.indexOf("\"", articleData.indexOf("title=") + 7) );
    //var isProStartIndex = articleData.indexOf('<p class="item_supp">');
    //var placeStartIndex = articleData.indexOf('<p class="item_supp">', isProStartIndex + 21) + 21; // 2ième occurence de item_supp
    //var placeEndIndex = articleData.indexOf('</p>', placeStartIndex);
    //var place = articleData.substring(placeStartIndex, placeEndIndex).trim();
    //var isProStartIndex = articleData.indexOf('<span class="ispro">');
    //var priceTabStartIndex = articleData.indexOf('<h3 class="item_price"') + 23;
    //var priceTabEndIndex = articleData.indexOf('&nbsp;&euro;</h3>', priceTabStartIndex);
    //var priceTab = articleData.substring(priceTabStartIndex, priceTabEndIndex).trim().split(" ");
    //var price = parseInt(priceTab.join(""));

    var title = getAttrValue('title', articleData);
	if(title != '') {
      var place = getMarkersContentByAttr('p', articleData, 'aditem_location');
      var price = parseInt(getMarkersContentByAttr('span', articleData, 'itemprop="price"'));
      log("title = " + title + '\n'
        + "place = " + place + '\n'
        + "price = " + price + '\n', levels.debug);
      if ( (minPrice == "" || price > minPrice) && (maxPrice == "" || price < maxPrice) ) {
        currentSearchAddedArticlesNbTab[0]++;
        var imgNb = getImgNb(articleData);
        body = body + "<li><a href=\"" + artUrl + "\">" + title + "</a> (" + price + "&nbsp;&euro; - " + place + ") - " + imgNb + ' photos';
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
