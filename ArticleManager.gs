function processArticle(articleData, oldLastArtIdsTab, searchRowIndex, currentSearchAddedArticlesNb) {
  var artUrl = "https://www.leboncoin.fr" + getAttrValue('href', articleData, '<a'); // lien vers le détail du 1er article
  log("artUrl = \"" + artUrl + "\"", levels.debug);
  var article;
  var articleData = getArticle(artUrl);

  if(article == undefined){
    log("L'url " + artUrl + " ne renvoie pas à un article", levels.error);
  } else {
    article = new Article(getArticle(artUrl));
    log("title = " + article.title + '\n'
        + "id = " + article.id + '\n'
        + "place = " + article.location + '\n'
        + "price = " + article.price + '\n'
        + "isPro = " + article.isPro + '\n'
        + "photosNb = " + article.photosNb, levels.debug);
    if (isAlreadyProcessedArticle(oldLastArtIdsTab, article.id)){
      log("Article '" + article.id + "' déjà traité", levels.debug);
    } else {
      try {
        oldLastArtIdsTab.push(article.id); // on ajoute l'élément au tableau des articles déjà traités
        oldLastArtIdsTab.sort(function(a, b){return b-a}); // on trie le tableau de manière décroissante
        log("oldLastArtIdsTab.valueOf() = " + oldLastArtIdsTab.valueOf(), levels.debug);
        if (logLevel < levels.debugReadOnly) {
          dataSheet.getRange(searchRowIndex,lastProductIdColomn).setValue(oldLastArtIdsTab.toString()) // on met à jour la cellule correspondante du classeur
        }
        log("Nouvel article ajouté : " + article.id, levels.info);
      } catch (err) {
        log("ERREUR lors de l'ajout de l'article '" + article.id + "'\n" + err, levels.error);
      }

      var priceDisplayed = article.price + "&nbsp;&euro; - ";
      if (isNaN(article.price)) priceDisplayed = '';
      if ( isNaN(article.price) || (minPrice == "" || article.price > minPrice) && (maxPrice == "" || article.price < maxPrice) ) {
        currentSearchAddedArticlesNb++;
        body = body + "<li><a href=\"" + artUrl + "\">" + article.title + "</a> (" + priceDisplayed + article.location + ")";
        // affichage des images
        if (article.photosNb > 0) {
          var imgCode = getImgCode(article);
          body = body + "<br/><a href=\"" + artUrl + '"><img src="' + imgCode + '</a>';
        }
        body = body  + "</li>";
      }
    }
  }
}

/**
 * Construit un objet à partir des infos de l'article récupéré sur sa page
 */
function getArticle(artUrl) {
  var artPage = UrlFetchApp.fetch(artUrl).getContentText();
  var searchedPattern = "<script>window.FLUX_STATE = ";
  var startArticleDataIndex = artPage.indexOf(searchedPattern) + searchedPattern.length;
  var endArticleDataIndex = artPage.indexOf('</script>', startArticleDataIndex);
  var articleData = artPage.substring(startArticleDataIndex, endArticleDataIndex);
  var article;
  try {
    article = JSON.parse(articleData)
  } catch (err) {
    log("ERREUR lors de la récupération des infos de l'article '" + extractid(artUrl) + "'\n" + err, levels.error);
  }
  return article;
}

/**
 * Met en forme la liste de photos de l'article
 */
function getImgCode(article) {
  var imgCode = '';
  var imgSrc = '';
  for( i = 0; i < article.photosNb; i++ ) {
    imgSrc = article.photosList[i];
    log("imgSrc = " + imgSrc, levels.debug);
    imgCode += '<img src="' + imgSrc + '"/>' + '&nbsp;';
  }
  return imgCode;
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