#!/bin/bash

CMD='mosquitto_pub -p 1883 -h local -I controller -t '
array=("Distance" "Move" "Turn")

error() {
	echo "$0 [Topic] [payload]"
	echo ""
	echo "Topic:"
	echo "    ${array[@]}"
	exit 1
}

if [ $# -ne 2 ]; then
	error
fi

for i in "${array[@]}"
do
  if [[ $i == $1 ]]
  then
	  $CMD Lego/$i -m "$2" && exit 0
  fi
done

error
