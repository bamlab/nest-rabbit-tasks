module.exports = {
  hooks: {
    beforeBump: ['yarn lint', 'yarn test'],
    beforeStage: 'yarn build',
  },
  git: {
    requireCleanWorkingDir: true,
    requireUpstream: true,
    requireCommits: true,
    addUntrackedFiles: true,
    commit: true,
    commitMessage: ':bookmark: release v${version}',
    commitArgs: '',
    tag: true,
    tagName: 'v${version}',
    tagAnnotation: ':bookmark: release ${version}',
    tagArgs: '',
    push: true,
    pushArgs: '--follow-tags',
    pushRepo: 'origin',
  },
  npm: {
    publish: true,
    publishPath: '.',
    access: null,
    otp: null,
  },
  github: {
    release: true,
    releaseName: ':bookmark: release ${version}',
    releaseNotes: null,
    preRelease: false,
  },
};
