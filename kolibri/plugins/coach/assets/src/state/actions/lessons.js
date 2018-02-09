import { LessonsPageNames } from '../../lessonsConstants';
import { getChannels } from 'kolibri.coreVue.vuex.getters';
import { setClassState } from './main';
import { LearnerGroupResource, LessonResource, ContentNodeResource } from 'kolibri.resources';
import { ContentNodeKinds } from 'kolibri.coreVue.vuex.constants';
import { createTranslator } from 'kolibri.utils.i18n';

const translator = createTranslator('lessonsPageTitles', {
  lessons: 'Lessons',
  selectResources: 'Select resources',
});

export function showLessonRootPage(store, classId) {
  store.dispatch('CORE_SET_PAGE_LOADING', true);
  store.dispatch('SET_PAGE_STATE', {
    lessons: [],
    learnerGroups: [],
  });
  const loadRequirements = [
    LearnerGroupResource.getCollection({ parent: classId }).fetch(),
    updateLessons(store, classId),
    setClassState(store, classId),
  ];
  return Promise.all(loadRequirements).then(
    ([learnerGroups]) => {
      store.dispatch('SET_LEARNER_GROUPS', learnerGroups);
      store.dispatch('SET_PAGE_NAME', LessonsPageNames.ROOT);
      store.dispatch('CORE_SET_TITLE', translator.$tr('lessons'));
      store.dispatch('CORE_SET_PAGE_LOADING', false);
    },
    () => {
      store.dispatch('CORE_SET_PAGE_LOADING', false);
    }
  );
}

export function updateLessons(store, classId) {
  return LessonResource.getCollection({ collection: classId })
    .fetch({}, true)
    ._promise.then(lessons => {
      store.dispatch('SET_CLASS_LESSONS', lessons);
    });
}

export function showLessonSummaryPage(store, classId, lessonId) {
  store.dispatch('CORE_SET_PAGE_LOADING', true);
  store.dispatch('SET_PAGE_STATE', {
    currentLesson: {},
    resourceContentNodes: [],
  });

  const loadRequirements = [
    LessonResource.getModel(lessonId).fetch(),
    LearnerGroupResource.getCollection({ parent: classId }).fetch(),
    setClassState(store, classId),
  ];

  Promise.all(loadRequirements).then(([lesson, learnerGroups]) => {
    const resourcePromises = lesson.resources.map(resource =>
      ContentNodeResource.getModel(resource.contentnode_id).fetch()
    );

    Promise.all(resourcePromises).then(resourceContentNodes => {
      store.dispatch('SET_RESOURCE_CONTENT_NODES', resourceContentNodes);
      store.dispatch('SET_LEARNER_GROUPS', learnerGroups);
      store.dispatch('SET_CURRENT_LESSON', lesson);
      store.dispatch('CORE_SET_PAGE_LOADING', false);
      store.dispatch('SET_PAGE_NAME', LessonsPageNames.SUMMARY);
      store.dispatch('CORE_SET_TITLE', lesson.name);
    });
  });
}

/* eslint-disable no-unused-vars */
export function showLessonResourceSummaryPage(store, classId, lessonId, contentId) {}

export function showLessonResourceUserSummaryPage(store, classId, lessonId, contentId, userId) {}

export function showLessonReviewPage(store, classId, lessonId) {}

export function showLessonResourceSelectionRootPage(store, classId, lessonId) {
  store.dispatch('CORE_SET_PAGE_LOADING', true);
  store.dispatch('SET_PAGE_STATE', {
    currentLesson: {},
    contentList: [],
    // TODO handle the resources that area already a part of the lesson
    selectedResources: store.state.pageState.selectedResources || [],
  });
  const loadRequirements = [updateLessons(store, classId), setClassState(store, classId)];
  return Promise.all(loadRequirements).then(
    () => {
      store.dispatch(
        'SET_CONTENT_LIST',
        getChannels(store.state).map(channel => {
          return {
            id: channel.root_id,
            description: channel.description,
            title: channel.title,
            thumbnail: channel.thumbnail,
            kind: ContentNodeKinds.CHANNEL,
          };
        })
      );
      store.dispatch(
        'SET_CURRENT_LESSON',
        store.state.pageState.lessons.find(lesson => lesson.id === lessonId)
      );
      store.dispatch('SET_PAGE_NAME', LessonsPageNames.SELECTION_ROOT);
      store.dispatch('CORE_SET_TITLE', translator.$tr('selectResources'));
      store.dispatch('CORE_SET_PAGE_LOADING', false);
    },
    () => {
      store.dispatch('CORE_SET_PAGE_LOADING', false);
    }
  );
}

function getThumbnailUrl(contentnode) {
  const fileWithThumbnail = contentnode.files.find(file => file.thumbnail && file.available);
  if (fileWithThumbnail) {
    return fileWithThumbnail.storage_url;
  }
  return null;
}

export function showLessonSelectionTopicPage(store, classId, lessonId, topicId) {
  store.dispatch('CORE_SET_PAGE_LOADING', true);
  store.dispatch('SET_PAGE_STATE', {
    currentLesson: {},
    contentList: [],
    selectedResources: store.state.pageState.selectedResources || [],
    lessons: [],
  });
  const loadRequirements = [
    ContentNodeResource.getModel(topicId).fetch(),
    ContentNodeResource.getCollection({ parent: topicId }).fetch(),
    ContentNodeResource.fetchAncestors(topicId),
    updateLessons(store, classId),
    setClassState(store, classId),
  ];
  return Promise.all(loadRequirements).then(
    ([topicNode, childNodes, ancestors]) => {
      store.dispatch(
        'SET_CONTENT_LIST',
        childNodes.map(node => {
          return {
            id: node.pk,
            description: node.description,
            title: node.title,
            thumbnail: getThumbnailUrl(node),
            kind: node.kind,
          };
        })
      );

      store.dispatch('SET_ANCESTORS', [...ancestors, topicNode]);
      store.dispatch(
        'SET_CURRENT_LESSON',
        store.state.pageState.lessons.find(lesson => lesson.id === lessonId)
      );
      store.dispatch('SET_PAGE_NAME', LessonsPageNames.SELECTION);
      store.dispatch('CORE_SET_TITLE', translator.$tr('selectResources'));
      store.dispatch('CORE_SET_PAGE_LOADING', false);
    },
    () => {
      store.dispatch('CORE_SET_PAGE_LOADING', false);
    }
  );
}

export function saveLessonResources(store, lessonId, resourceArray) {
  LessonResource.getModel(lessonId).save({
    resources: resourceArray.map(resourceId => ({ contentnode_id: resourceId })),
  });
}

export function showLessonSelectionSearchPage(store, classId, lessonId, searchTerm) {}

export function showLessonContentPreview(store, classId, lessonId, contentId) {}
