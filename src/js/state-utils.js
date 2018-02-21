'use strict';

const { ck, mapRelationsToItemKeys } = require('./utils');

//@TODO: multi-library support
const getLibraryKey = state => {
	return 'libraryKey' in state.library ? state.library.libraryKey : null;
};

const isTopLevel = state => {
	return !!getLibraryKey(state) && !('collection' in state.router.params);
};

const getLibraryItemCount = state => {
	const libraryKey = getLibraryKey(state);
	return libraryKey && libraryKey in state.itemCountByLibrary ? state.itemCountByLibrary[libraryKey] : null;
};

const isCollectionSelected = state => {
	const libraryKey = getLibraryKey(state);
	const collections = state.collectionsByLibrary[libraryKey];
	const isCollectionInPath = state.router && 'collection' in state.router.params;

	return libraryKey && collections && isCollectionInPath;
};

const isFetchingItems = state => {
	const libraryKey = getLibraryKey(state);
	const collection = getCollection(state);

	if(isTopLevel(state)) {
		return state.fetching.itemsTop;
	}

	if(collection) {
		const collectionCKey = ck(collection.key, libraryKey);
		return state.fetching.itemsInCollection.includes(collectionCKey);
	}

	return false;
};

const getCollectionsPath = state => {
	const libraryKey = getLibraryKey(state);
	const path = [];
	var nextKey = isCollectionSelected(state) ? state.router.params.collection : false;
	
	while(nextKey) {
		const collection = state.collections[ck(nextKey, libraryKey)];
		path.push(collection.key);
		nextKey = collection.parentCollection;
	}

	return path.reverse();
};

// const mapTreePath = (selectedKey, currentLevelCollections, collections, libraryKey, curPath = []) => {
// 	for(const collection of currentLevelCollections) {
// 		if(collection.key === selectedKey) {
// 			return curPath.concat(collection.key);
// 		} else if(collection.children.length) {
// 			const nextLevelCollections = collection.children.map(collectionKey => collections[ck(collectionKey, libraryKey)]);
// 			const maybePath = mapTreePath(
// 				selectedKey, 
// 				nextLevelCollections,
// 				collections,
// 				libraryKey,
// 				curPath.concat(collection.key)
// 			);
// 			if(maybePath.includes(selectedKey)) {
// 				return maybePath;
// 			}
// 		}
// 	}

// 	return curPath;
// };

const getCurrentViewFromState = state => {
	if(isCollectionSelected(state)) {
		const libraryKey = getLibraryKey(state);
		const selectedCollectionKey = state.router.params.collection;
		const selectedCollection = state.collections[ck(selectedCollectionKey, libraryKey)];
		
		if('item' in state.router.params && state.itemsByCollection[ck(selectedCollectionKey, libraryKey)]) {
			let selectedItemKey = state.router.params.item;
			let selectedItem = state.items[ck(selectedItemKey, libraryKey)];
			if(selectedItem) {
				return 'item-details';
			}
		}

		if(selectedCollection && !selectedCollection.hasChildren) {
			return 'item-list';
		}
	}

	return 'library';
};

const getCollection = state => {
	if(isCollectionSelected(state)) {
		const collectionKey = state.router.params.collection;
		const libraryKey = getLibraryKey(state);
		const collectionCKey = ck(collectionKey, libraryKey);

		if(collectionCKey in state.collections) {
			return state.collections[collectionCKey];
		}
	}

	return null;
};

const getCollections = state => {
	const libraryKey = getLibraryKey(state);
	const keys = libraryKey && state.collectionsByLibrary[libraryKey] && state.collectionsByLibrary[libraryKey] || [];
	return keys.map(ckey => state.collections[ckey]);
};

const getTopCollections = state => {
	return getCollections(state).filter(collection => !collection.parentCollection);
};

const getCollectionItemCount = state => {
	const libraryKey = getLibraryKey(state);
	const collection = getCollection(state);
	if(libraryKey && collection) {
		return state.itemCountByCollection[ck(collection.key, libraryKey)];
	}

	return null;
};

const getItem = state => {
	const libraryKey = getLibraryKey(state);
	const itemKey = state.router && 'item' in  state.router.params && state.router.params.item;
	const itemCKey = ck(itemKey, libraryKey);
	return itemCKey in state.items ? state.items[itemCKey] : null;
};

const getItems = state => {
	const libraryKey = getLibraryKey(state);
	const collection = getCollection(state);

	if(isTopLevel(state)) {
		const ckeys = libraryKey && state.itemsTop || [];
		return ckeys.map(ckey => state.items[ckey]);
	} else {
		const ckeys = libraryKey && collection && state.itemsByCollection[ck(collection.key, libraryKey)] || [];
		return ckeys.map(ckey => state.items[ckey]);
	}
};

const getChildItems = state => {
	const libraryKey = getLibraryKey(state);
	const item = getItem(state);
	const ckeys = libraryKey && item && state.itemsByParentItem[ck(item.key, libraryKey)] || [];
	return ckeys.map(ckey => state.items[ckey]);
};

const getRelatedItems = state => {
	const libraryKey = getLibraryKey(state);
	const item = getItem(state);
	if(!item) {
		return [];
	}
	const relatedItemKeys = mapRelationsToItemKeys(item.relations, state.config.userId);
	return relatedItemKeys.map(relatedItemKey => {
		relatedItemKey = ck(relatedItemKey, libraryKey);
		if(relatedItemKey in state.items) {
			return state.items[relatedItemKey];
		}
	}).filter(item => item !== null);
};

const getItemFieldValue = (field, state) => {
	const libraryKey = getLibraryKey(state);
	const item = getItem(state);
	const itemCKey = ck(item.key, libraryKey);
	const isBeingUpdated = isItemFieldBeingUpdated(field, state);
	if(isBeingUpdated) {
		let aggregatedPatch = {};
		state.updating.items[itemCKey].forEach(queueItem => {
			aggregatedPatch = {
				...queueItem.patch
			};
		});
		return aggregatedPatch[field];
	} else {
		return item && item[field];
	}
};

const isItemFieldBeingUpdated = (field, state) => {
	const libraryKey = getLibraryKey(state);
	const item = getItem(state);
	if(!item) {
		return false;
	}
	const itemCKey = ck(item.key, libraryKey);
	return item && 
		state.updating.items && 
		itemCKey in state.updating.items && 
		state.updating.items[itemCKey].some(
			queueItem => field in queueItem.patch
		);
};

module.exports = {
	getChildItems,
	getCollection,
	getCollectionItemCount,
	getCollections,
	getCollectionsPath,
	getCurrentViewFromState,
	getItem,
	getItemFieldValue,
	getItems,
	getLibraryItemCount,
	getLibraryKey,
	getRelatedItems,
	getTopCollections,
	isCollectionSelected,
	isFetchingItems,
	isItemFieldBeingUpdated,
	isTopLevel,
};