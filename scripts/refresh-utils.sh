#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
workspace_dir="$(cd "${script_dir}/.." && pwd)"
project_dir="${workspace_dir}"
utils_dir="${workspace_dir}/../../de-code-kas/utils"

copy_file() {
  local source_file="$1"
  local target_file="$2"

  if [[ ! -f "${source_file}" ]]; then
    printf 'Source file not found: %s\n' "${source_file}" >&2
    exit 1
  fi

  cp "${source_file}" "${target_file}"
}

copy_directory_contents() {
  local source_dir="$1"
  local target_dir="$2"

  if [[ ! -d "${source_dir}" ]]; then
    printf 'Source directory not found: %s\n' "${source_dir}" >&2
    exit 1
  fi

  mkdir -p "${target_dir}"
  cp -R "${source_dir}/." "${target_dir}/"
}

copy_file \
  "${utils_dir}/templates/github/.agents/skills/document_changes/SKILL.md" \
  "${project_dir}/.agents/skills/document_changes/SKILL.md"

copy_file \
  "${utils_dir}/templates/github/.github/ISSUE_TEMPLATE/bug_report.yml" \
  "${project_dir}/.github/ISSUE_TEMPLATE/bug_report.yml"

copy_file \
  "${utils_dir}/templates/github/.github/ISSUE_TEMPLATE/config.yml" \
  "${project_dir}/.github/ISSUE_TEMPLATE/config.yml"

copy_file \
  "${utils_dir}/templates/github/.github/ISSUE_TEMPLATE/feature_request.yml" \
  "${project_dir}/.github/ISSUE_TEMPLATE/feature_request.yml"

copy_file \
  "${utils_dir}/templates/github/.github/ISSUE_TEMPLATE/task.yml" \
  "${project_dir}/.github/ISSUE_TEMPLATE/task.yml"

copy_file \
  "${utils_dir}/templates/github/.github/dependabot.yml" \
  "${project_dir}/.github/dependabot.yml"

copy_file \
  "${utils_dir}/templates/github/.github/pull_request_template.md" \
  "${project_dir}/.github/pull_request_template.md"

copy_file \
  "${utils_dir}/templates/github/.github/SECURITY.md" \
  "${project_dir}/.github/SECURITY.md"

copy_file \
  "${utils_dir}/templates/github/.editorconfig" \
  "${project_dir}/.editorconfig"

copy_file \
  "${utils_dir}/templates/github/.gitattributes" \
  "${project_dir}/.gitattributes"

copy_file \
  "${utils_dir}/templates/github/CONTRIBUTING.md" \
  "${project_dir}/CONTRIBUTING.md"

copy_file \
  "${utils_dir}/templates/github/SECURITY.md" \
  "${project_dir}/SECURITY.md"

copy_directory_contents \
  "${utils_dir}/.agents/skills/codedocumentation" \
  "${workspace_dir}/.agents/skills/codedocumentation"

copy_directory_contents \
  "${utils_dir}/.agents/skills/frontend-architect" \
  "${workspace_dir}/.agents/skills/frontend-architect"

copy_directory_contents \
  "${utils_dir}/.agents/skills/product-owner" \
  "${workspace_dir}/.agents/skills/product-owner"

copy_directory_contents \
  "${utils_dir}/.agents/skills/qa-engineer" \
  "${workspace_dir}/.agents/skills/qa-engineer"

copy_directory_contents \
  "${utils_dir}/.agents/skills/security-engineer" \
  "${workspace_dir}/.agents/skills/security-engineer"
