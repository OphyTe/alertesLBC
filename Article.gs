function Article(jsonObject){
  this.title = jsonObject.adview.subject;
  this.id = jsonObject.adview.list_id;
  this.url = jsonObject.adview.url.replace(/\\u002F/gm, '/');
  this.location = jsonObject.adview.location != undefined ? jsonObject.adview.location.city_label : undefined;
  this.price = jsonObject.adview.price != undefined ? parseInt(jsonObject.adview.price[0]) : undefined;
  this.isPro = jsonObject.adview.owner.type == 'pro' ? true : false;
  this.photosNb = jsonObject.adview.images != undefined ? jsonObject.adview.images.nb_images : undefined;
  this.photosList = this.photosNb != undefined ? jsonObject.adview.images.urls_thumb : undefined;
}