// Liste des feuilles
var ss = SpreadsheetApp.getActiveSpreadsheet();
var dataSheet = ss.getSheetByName("Données");
var historySheet = ss.getSheetByName("History");
var categoriesSheet = ss.getSheetByName("Catégories");
var logSheet = ss.getSheetByName("Log");

// Structure de la feuille Données
var searchLabelColomn = 1;
var categoryColomn = 2;
var minPriceColomn = 3;
var maxPriceColomn = 4;
var urlColomn = 5;
var lastProductIdColomn = 6;
var firstDataRow = 4;

// Structure de la feuille Catégories
var categoryFirstRow = 2;
var categoryIdColomn = 1;
var categoryTextUrlColomn = 2;
var categoryLabelColomn = 3;

var processedIdsCell = { row: 1, col: 4 };

// Variables globales
var levels = {
  separator: -1,
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  debugReadOnly: 4, // pas d'envoi de mail et pas de modification de l'onglet de données
  debugNoMail: 5, // pas d'envoi de mail au développeur
}
var debugEmailAddress = "ophyte@gmail.com";
var logLevel; //= PropertiesService.getScriptProperties().getProperty('logLevel');
switch (dataSheet.getRange(1,2).getValue()) {
  case "error" :
    logLevel = levels.error;
    break;
  case "warn" :
    logLevel = levels.warn;
    break;
  case "debug" :
    logLevel = levels.debug;
    break;
  case "debugNoMail" :
    logLevel = levels.debugNoMail;
    break;
  case "debugReadOnly" :
    logLevel = levels.debugReadOnly;
    break;
  default:
    logLevel = levels.info;
    break;
}
var body = "";
var corps = "";
var objetMail = "Alertes LBC";
var addedArticlesTotalNb = 0;
var searchLabel;
var docUrl = "https://docs.google.com/spreadsheets/d/1R934HpCNFbnzU3gOexUI7rjkbUhU_CRpYyKo0I35kJU"; // url du classeur

log("'=========== Début d'exécution ===========", levels.separator);
log("Log level = " + logLevel, levels.info);


/**
 * Fonction principale
 */
function lbc(){
  var email = PropertiesService.getScriptProperties().getProperty('email');
  if(email == "" || email == null ){
    Browser.msgBox("L'email du destinataire n'est pas définit. Allez dans le menu \"Lbc Alertes\" puis \"Gérer email\".");
    log("Email non définit !", levels.error);
  } else {
    var currentRow = firstDataRow;
    while(!(dataSheet.getRange(currentRow,urlColomn).getValue() == "" && dataSheet.getRange(currentRow,categoryColomn).getValue() == "")){
      searchLabel = dataSheet.getRange(currentRow,searchLabelColomn).getValue();
      log("Traitement de la recherche '" + searchLabel + "'", levels.debug);
      defineSearchUrls(currentRow);
      body = "";
      var rep = UrlFetchApp.fetch(currentSearchUrl).getContentText();
      minPrice = dataSheet.getRange(currentRow,minPriceColomn).getValue();
      maxPrice = dataSheet.getRange(currentRow,maxPriceColomn).getValue();
      // Aucune annonce ne répond aux critères
      if(rep.indexOf("aucun résultat") >= 0){
        log("Aucune annonce pour la recherche \"" + searchLabel + "\" !", levels.info);
      } else {
        var data = getArticlesListDivData(rep);
        processArticles(data);
      }    
      currentRow++;
    }
    searchLabel = null;
    log(addedArticlesTotalNb + " articles ajoutés au total", levels.info);
    
    if(corps != ""){
      objetMail = objetMail + " (" + addedArticlesTotalNb + " articles)";
      corps += '<p>Clique <a href="' + docUrl + '">ici</a> pour gérer tes alertes.</p>';
      if (logLevel < levels.debug) {
        MailApp.sendEmail(email,objetMail,corps,{ htmlBody: corps });
        log("Mail envoyé à " + email, levels.info);
      } else if (logLevel < levels.debugNoMail) {
          MailApp.sendEmail(debugEmailAddress, objetMail,corps, { htmlBody: corps });
          log("Mail envoyé à " + debugEmailAddress, levels.info);
      }
    } else {
      log("Rien de nouveau => pas d'envoi de mail", levels.info);
    }
  }
}

/**
 * Fonction itérant sur la liste des articles de la recherche en cours
 */
function processArticles (data) {
  var oldLastArtIdsList = dataSheet.getRange(processedIdsCell.row, processedIdsCell.col).getValue();
  var oldLastArtIdsTab = oldLastArtIdsList == "" ? [] : oldLastArtIdsList.split(","); // tableau des ids des articles déjà traités  
  var processedArtNb = 0;
  var currentSearchAddedArticlesNb = 0;
  if(oldLastArtIdsList == "") {
    log("Aucun article enregistré", levels.info);
  } else {
    log("Articles enregistrés : '" + oldLastArtIdsList + "'", levels.debug);
  }
  // Itération sur les articles de la page
  while(data.indexOf("<a", 1) > 0){
    //log("Data : '" + data + "'", levels.debug);
    processedArtNb++;
    var currentArticleIndex = data.indexOf("<a", 1);
    var nextArticleIndex = data.indexOf("</li") + 6;
    var articleData = data.substring(currentArticleIndex, nextArticleIndex);
    // log("articleData : \n'" + articleData + "'", levels.debug);
    if ( nextArticleIndex > currentArticleIndex ) currentSearchAddedArticlesNb = processArticle(articleData, oldLastArtIdsTab, currentSearchAddedArticlesNb);
    data = data.substring(nextArticleIndex); // liste des articles de la page
  }
  if ( currentSearchAddedArticlesNb > 0 ) {
    addedArticlesTotalNb += currentSearchAddedArticlesNb;
    corps = corps + "<p> Recherche - <a href=\""+ currentSearchUrl + "\"> "+ searchLabel + "</a> " + "<ul>" + body + "</ul></p>";
      if (logLevel < levels.debugReadOnly) {
	      historySheet.insertRowBefore(2);
	      historySheet.getRange("A2").setValue(searchLabel);
	      historySheet.getRange("B2").setValue(currentSearchAddedArticlesNb);
	      historySheet.getRange("C2").setValue(new Date);
    }
  }
  //if (logLevel < levels.debugReadOnly) {
  //   dataSheet.getRange(processedIdsCell.row, processedIdsCell.col).setValue(artId);
  //}
  if (logLevel >= levels.debug) {
    log(processedArtNb + " articles analysés ; " + currentSearchAddedArticlesNb + " articles ajoutés ; " + addedArticlesTotalNb + " articles ajoutés au total", levels.info);
  } else {
    log(processedArtNb + " articles analysés  -  " + currentSearchAddedArticlesNb + " articles ajoutés", levels.info);
  }
}


/**
 * Fonction supprimant les articles obsolètes de l'historique
 */
 function cleanOldArticles() {
   var currentRow = firstDataRow;
   var oldLastArtIdsList = dataSheet.getRange(processedIdsCell.row, processedIdsCell.col).getValue();
   var oldLastArtIdsTab = oldLastArtIdsList == "" ? [] : oldLastArtIdsList.split(","); // tableau des ids des articles déjà traités
   var currentSearchDeletededArticlesNb = 0;
   var i = 0;
   while (i < oldLastArtIdsTab.length) {
     try {
       var currentOldArtUrl = "http://www.leboncoin.fr/offre/" + oldLastArtIdsTab[i] + ".htm";       
       var httpResponse = UrlFetchApp.fetch(currentOldArtUrl);
       /*if (httpResponse.getResponseCode() == 404) {
       oldLastArtIdsTab.splice(i,1);
       log("Article n°" + oldLastArtIdsTab[i] + " inexistant : " + currentOldArtUrl, levels.debug);
       } else {*/
       i++;
       //}
     } catch (err) {
       //log("Erreur sur le traitement du tableau 'oldLastArtIdsTab' : " + err.message, levels.error);
       //log("httpResponse.getResponseCode() = " + httpResponse.getResponseCode(), levels.debug);
       //log("oldLastArtIdsTab = " + oldLastArtIdsTab, levels.error);
       log("L'article n°" + oldLastArtIdsTab[i] + " a été supprimé (" + currentOldArtUrl + ")", levels.info);
       currentSearchDeletededArticlesNb++;
       oldLastArtIdsTab.splice(i,1);
     }
   }
   if (logLevel < levels.debugReadOnly) {
      dataSheet.getRange(processedIdsCell.row, processedIdsCell.col).setValue(oldLastArtIdsTab.toString()) // on met à jour la cellule correspondante du classeur
   }
   log(currentSearchDeletededArticlesNb + " articles supprimés", levels.info);
   log("Articles enregistrés après suppression des articles obsolètes : '" + oldLastArtIdsTab + "'", levels.debug);
 }


function checkMail(){
  if(ScriptProperties.getProperty('email') == "" || ScriptProperties.getProperty('email') == null ){
    Browser.msgBox("L'email du destinataire n'est pas définit. Allez dans le menu \"Lbc Alertes\" puis \"Gérer email\".");
  }
}

function setupmail(){
  var email = PropertiesService.getScriptProperties().getProperty('email');
  if(email == "" || email == null ){
    var quest = Browser.inputBox("Entrez votre email, le programme ne vérifie pas le contenu de cette boite.", Browser.Buttons.OK_CANCEL);
    if(quest == "cancel"){
      Browser.msgBox("Ajout email annulé.");
      log("Ajout email annulé", levels.info);
      return false;
    }else{
      PropertiesService.getScriptProperties().setProperty('email', quest);
      Browser.msgBox("Email " + PropertiesService.getScriptProperties().getProperty('email') + " ajouté");
      log("Email " + PropertiesService.getScriptProperties().getProperty('email') + " ajouté", levels.info);
    }
  }else{
    var quest = Browser.inputBox("Entrez un email pour modifier l'email : " + email , Browser.Buttons.OK_CANCEL);
    if(quest == "cancel"){
      Browser.msgBox("Modification email annulé.");
      log("Modification email annulé", levels.info);
      return false;
    }else{
      PropertiesService.getScriptProperties().setProperty('email', quest);
      Browser.msgBox("Email " + PropertiesService.getScriptProperties().getProperty('email') + " ajouté");
      log("Email " + PropertiesService.getScriptProperties().getProperty('email') + " ajouté", levels.info);
    }
  }
}


function onOpen() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [{
    name : "Lancer manuellement",
    functionName : "lbc"
  },/*{
    name : "Créer une nouvelle alerte",
    functionName : "createAlert"
  },*/{
    name : "Gérer email",
    functionName : "setupmail"
  },{
    name : "Nettoyer les vieux articles consultés",
    functionName : "cleanOldArticles"
  },{
    name : "Changer le niveau de log",
    functionName : "switchLogLevel"
  }];
  sheet.addMenu("Lbc Alertes", entries);
  checkMail();
};


/**
 * Fonction définissant les urls de la recherche courante (mobile et desktop)
 * Expression régulière pour récupérer le mapping des catégories : <option [^>]*value="([^"]*)"[^>]*>([^<]*)</option>
 */
function defineSearchUrls(dataCurrentRow) {
  currentSearchUrl = dataSheet.getRange(dataCurrentRow,urlColomn).getValue();
  var searchedCategoryLabel = dataSheet.getRange(dataCurrentRow,categoryColomn).getValue();
  if (currentSearchUrl == "") {
    var currentCategoryRow = categoryFirstRow;
    do {
      var currentCategoryLabel = categoriesSheet.getRange(currentCategoryRow,categoryLabelColomn).getValue();
      if (currentCategoryLabel == searchedCategoryLabel) {
        var searchCategoryTextUrl = categoriesSheet.getRange(currentCategoryRow,categoryTextUrlColomn).getValue();
        var formatedTextUrl = formatTextUrl(searchLabel);
        currentSearchUrl = "https://www.leboncoin.fr/recherche/?text=" + formatedTextUrl + "&category=" + searchCategoryTextUrl + "&region=2&departement=33";
        // par exemple https://www.leboncoin.fr/recherche/?text=hotte&category=20&region=2&departement=33        
        if (logLevel < levels.debugReadOnly) {
          dataSheet.getRange(dataCurrentRow,urlColomn).setValue(currentSearchUrl);
          log("url de recherche desktop définie : " + currentSearchUrl, levels.info);
        }
      }
      currentCategoryRow++
    }
    while(currentCategoryLabel != "" && currentCategoryLabel != searchedCategoryLabel);
  }
}

/*
 * Fonction permettant de formater du texte pour le mettre dans l'url
 * Remplace les caractères spéciaux par leur équivalent en hexadecimal
 */
function formatTextUrl(text) {
  var replacedText = text;
  var specialCharacters = [{
    label : "é",
    code : "%E9"
  },{
    label : "è",
    code : "%E8"
  },{
    label : "ê",
    code : "%EA"
  },{
    label : "à",
    code : "%E0"
  },{
    label : "ô",
    code : "%F4"
  },{
    label : "ï",
    code : "%EF"
  },{
    label : "î",
    code : "%EE"
  },{
    label : " ",
    code : "+"
  },{
    label : "ù",
    code : "%F9"
  },{
    label : "ç",
    code : "%E7"
  }];
  var i = 0;
  while (i < specialCharacters.length) {
    replacedText = replacedText.replace(specialCharacters[i].label, specialCharacters[i].code);
    i++;
  }
  log("'" + text + "' remplacé en '" + replacedText + "'", levels.debug);
  return replacedText;
}

/*
 * Fonction permettant de logger un message selon un niveau spécifié
 */
function log(message, level) {
  Logger.log('[' + level + '] ' + message);
  if (level == levels.separator) writeLog("",level);
  if (level == levels.separator) writeLog("",level);
  if (level <= logLevel) writeLog(message, level);
};

/*
 * Fonction écrivant la log
 */
function writeLog(message, level) {
  logSheet.insertRowBefore(2);
  try {
    logSheet.getRange("A2").setValue(new Date);
    logSheet.getRange("B2").setValue(level);
    if ( searchLabel != null ) logSheet.getRange("C2").setValue(searchLabel);
    logSheet.getRange("D2").setValue(message);
  } catch (err) {
    log(err, levels.error);
  }
}

/**
 * Fonction vérifiant si l'article en cours de traitement n'a pas déjà été traité auparavant
 */
function isAlreadyProcessedArticle(oldLastArtIdsTab, id) {
  log("isAlreadyProcessedArticle: id = " + id, levels.debug);
  log("isAlreadyProcessedArticle: typeof  id = " + typeof id, levels.debug);
  //log("isAlreadyProcessedArticle: oldLastArtIdsTab = " + oldLastArtIdsTab, levels.debug);
  //log("isAlreadyProcessedArticle: oldLastArtIdsTab.length = " + oldLastArtIdsTab.length, levels.debug);
  var i = 0;
  try {
    while (i < oldLastArtIdsTab.length && parseInt(oldLastArtIdsTab[i]) > parseInt(id)) {
      log("isAlreadyProcessedArticle: typeof oldLastArtIdsTab[" + i + "] = " + typeof oldLastArtIdsTab[i], levels.debug);
      //log("isAlreadyProcessedArticle: i < oldLastArtIdsTab.length = " + i < oldLastArtIdsTab.length, levels.debug);
      //log("isAlreadyProcessedArticle: oldLastArtIdsTab[i] > id = " + oldLastArtIdsTab[i] > id, levels.debug);
      i++;
    }
  } catch (err) {
    log("Erreur sur le traitement du tableau 'oldLastArtIdsTab' : " + err, levels.error);
    log("oldLastArtIdsTab = " + oldLastArtIdsTab, levels.error);
  }
  if (oldLastArtIdsTab[i] == id) return true;
  else return false;
}

/**
 * Définition du niveau de log
 */
function switchLogLevel() {
  /*if (logLevel < levels.debugNoMail) {
    logLevel++;
  } else {
    logLevel = levels.error;
  }
    ScriptProperties.setProperty('logLevel', logLevel);
    Browser.msgBox("Le niveau de log passe à " + logLevel);*/
  if (logLevel != levels.debugReadOnly) {
    logLevel = levels.debugReadOnly;
    Browser.msgBox("Le niveau de log est passé à DEBUG (read only)");
  } else {
    logLevel = levels.info;
    Browser.msgBox("Le niveau de log est passé à INFO");
  }
  ScriptProperties.setProperty('logLevel', logLevel);
}

/**
 * Fonction permettant d'archiver les alertes sélectionnées
 */
function archiveSelectedAlert() {
  var selectedCells = dataSheet.getActiveRange();
}