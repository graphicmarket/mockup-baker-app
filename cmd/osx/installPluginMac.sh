#! /bin/bash
path="$(cd "$(dirname "$1")"; pwd -P)/$(basename "$1")"
path=$path"Plugin/234a7e6c_PS.ccx"
cd "/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS"

./UnifiedPluginInstallerAgent --install $path